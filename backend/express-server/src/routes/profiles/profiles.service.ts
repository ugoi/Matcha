import { get, has } from "lodash";
import db, { pgp } from "../../config/db-config.js";
import { JError, JFail } from "../../error-handlers/custom-errors.js";
import { FilterSet, picturesNotExists, SortSet } from "../../utils/utils.js";
import { BlockedUser, Match } from "./matchs.interface.js";
import { Picture } from "./pictures.interface.js";
import { picturesRepository } from "./pictures.repository.js";
import {
  CreateProfileInput,
  FilterBy,
  Profile,
  SearchPreferences,
  SortBy,
  SortOrder,
  UpdateProfileInput,
} from "./profiles.interface.js";
import {
  blockedUsersRepository,
  likesRepository,
  profilesRepository,
  searchPreferencesRepository,
} from "./profiles.repository.js";
import { interestsRepository } from "./interests.repository.js";
import { notificationService } from "../notifications/notifications.service.js";
import {
  NOTIFICATION_ENTITY_TYPE,
  NOTIFICATION_STATUS,
} from "../notifications/notification.interface.js";
import { notificationsWebsocketService } from "../notifications/notifications.websocket.service.js";

export const profilesService = {
  getProfile: async function getProfile(user_id: string) {
    const data = await profilesRepository.findOne(user_id);

    if (data === null) {
      return null;
    }

    const [userInterests, userPictures, searchPreferences] = await Promise.all([
      interestsRepository.find(data.user_id),
      picturesRepository.find(data.user_id),
      searchPreferencesRepository.find(data.user_id),
    ]);

    let profile: Profile = {
      ...data,
      interests: userInterests,
      pictures: userPictures,
      search_preferences: searchPreferences,
    };

    return profile;
  },

  async createProfile(input: CreateProfileInput): Promise<Profile> {
    const { user_id, data } = input;

    // Check if profile_picture is inside user_pictures
    const userPictures = await picturesRepository.find(user_id);

    if (
      !userPictures.some(
        (picture: Picture) => picture.picture_url === data.profile_picture
      )
    ) {
      throw new JError(
        "Profile picture not found in user pictures - Please upload the pictures first with POST http://localhost:3000/api/profiles/me/pictures"
      );
    }

    let newProfile = await profilesRepository.create(input);

    return newProfile;
  },

  async updateProfile(input: UpdateProfileInput): Promise<Profile> {
    const { gps_latitude, gps_longitude } = input.data;

    // Prepare the location SQL expression if coordinates are provided
    let locationRawSQL = undefined;
    if (gps_latitude && gps_longitude) {
      locationRawSQL = pgp.as.format("st_point($1, $2)", [
        gps_longitude,
        gps_latitude,
      ]);
    }

    // Remove gps fields from input and add the raw SQL expression for location
    const transformedData = {
      ...input.data,
      location: locationRawSQL,
    };

    // Filter out undefined fields
    const cleanData = Object.fromEntries(
      Object.entries(transformedData).filter(([_, v]) => v !== undefined)
    );

    // Call repository with cleaned data
    return profilesRepository.update({
      user_id: input.user_id,
      data: cleanData,
    });
  },

  async searchProfiles(searchPreferences: SearchPreferences) {
    const { user_id, filter_by = {}, sort_by = {} } = searchPreferences;

    // Retrieve the current user's profile data for location and preference-based filtering
    const currentUser = await this.getProfile(user_id);

    // Set default filter if required
    const defaultFilter: FilterBy =
      process.env.DEFAULT_FILTER === "true"
        ? {
            gender: { $eq: currentUser.sexual_preference },
            location: {
              $lt: 100,
              value: {
                longitude: currentUser.gps_longitude,
                latitude: currentUser.gps_latitude,
              },
            },
            fame_rating: { $gte: 0 },
            common_interests: { $gte: 2 },
          }
        : { user_id: { $neq: currentUser.user_id } };

    // Merge default and custom filters
    const mergedFilter = { ...defaultFilter, ...filter_by };

    // Prepare filter set
    const filterSet =
      Object.keys(mergedFilter).length > 0
        ? new FilterSet(mergedFilter)
        : undefined;
    const where = filterSet ? pgp.as.format("WHERE $1", filterSet) : "";

    // Set default sort if required
    const defaultSortBy: SortBy =
      process.env.DEFAULT_SORT === "true"
        ? {
            location: {
              value: {
                longitude: currentUser.gps_longitude,
                latitude: currentUser.gps_latitude,
              },
              $order: SortOrder.Asc,
            },
          }
        : {};

    // Merge default and custom sort options
    const mergedSortBy = { ...defaultSortBy, ...sort_by };

    // Prepare sort set
    const sortSet =
      Object.keys(mergedSortBy).length > 0
        ? new SortSet(mergedSortBy)
        : undefined;
    const order = sortSet ? pgp.as.format("ORDER BY $1", sortSet) : "";

    // Call repository to get the list of profiles
    return profilesRepository.find(user_id, where, order);
  },

  updateLastOnline: async function updateLastOnline(user_id: string) {
    let statement = pgp.as.format(
      `
      UPDATE profiles
      SET last_online = NOW()
      WHERE user_id = $1
      `,
      user_id
    );

    await db.none(statement);

    return;
  },

  pictureExists: async function pictureExists(picture_id, user_id) {
    // Check if profile_picture is inside user_pictures
    const userPictures = await picturesRepository.find(user_id);

    if (
      !userPictures.some(
        (picture: Picture) => picture.picture_url === picture_id
      )
    ) {
      throw new JFail(
        null,
        "Profile picture not found in user pictures - Please upload the pictures first with POST http://localhost:3000/api/profiles/me/pictures/" +
          picture_id
      );
    }
  },

  picturesNotExist: async function picturesNotExist(
    uploadPictures: Array<string>,
    user_id: string
  ) {
    const userPictures = await picturesRepository.find(user_id);

    // Get overlap between userPictures and uploadPictures
    const overlap = userPictures.filter((picture: Picture) =>
      uploadPictures.includes(picture.picture_url)
    );

    const overlapMessage = overlap
      .map((picture: Picture) => picture.picture_url)
      .join(", ");

    if (overlap.length > 0) {
      throw new JFail(
        null,
        "Following pictures already exist: " + overlapMessage
      );
    }
  },
};

export const likesService = {
  hasLiked: async function hasLiked(
    liker_user_id: string,
    likee_user_id: string
  ): Promise<boolean> {
    const existingLike = await likesRepository.findLike(
      liker_user_id,
      likee_user_id
    );

    return existingLike?.is_like === true;
  },

  like: async function like(
    liker_user_id: string,
    likee_user_id: string
  ): Promise<Match> {
    // Check if you are liking yourself
    if (liker_user_id === likee_user_id) {
      throw new Error("You cannot like yourself");
    }

    // Check if you already liked the user
    const existingLike = await likesRepository.findLike(
      liker_user_id,
      likee_user_id
    );
    if (existingLike?.is_like === true) {
      throw new Error("You already liked this user");
    }

    let match = null;
    // If like exists update it to like
    if (existingLike) {
      match = await likesService.updateLikeStatus({
        user_id: liker_user_id,
        likee_user_id: likee_user_id,
        data: { is_like: true },
      });
    } else {
      match = await likesRepository.add(liker_user_id, likee_user_id);
    }

    // Check if the user already liked you
    const matches = await likesRepository.findMatches(liker_user_id);

    // Check if you have a match
    const existingMatch = matches.find(
      (match: Match) =>
        match.liker_user_id === likee_user_id &&
        match.likee_user_id === liker_user_id &&
        match.is_like === true
    );

    // Calculate new fame rating
    const likedProfile = await profilesRepository.findOne(likee_user_id);
    let fame_rating = likedProfile.fame_rating + 1;
    // Increment fame rating of liked user
    await profilesService.updateProfile({
      data: { fame_rating: fame_rating },
      user_id: likee_user_id,
    });

    if (existingMatch) {
      await notificationService.createAndSend({
        entity_type: NOTIFICATION_ENTITY_TYPE.MATCH,
        entity_id: existingMatch.liker_user_id,
        status: NOTIFICATION_STATUS.SENT,
        receivers: [existingMatch.liker_user_id, existingMatch.likee_user_id],
        sender: existingMatch.liker_user_id,
      });
    } else {
      await notificationService.createAndSend({
        entity_type: NOTIFICATION_ENTITY_TYPE.LIKE,
        entity_id: liker_user_id,
        status: NOTIFICATION_STATUS.SENT,
        receivers: [likee_user_id],
        sender: liker_user_id,
      });
    }

    return {
      ...match,
      both_matched: !!existingMatch,
    };
  },

  dislike: async function dislike(
    liker_user_id: string,
    likee_user_id: string
  ): Promise<Match> {
    // Check if you are liking yourself
    if (liker_user_id === likee_user_id) {
      throw new Error("You cannot dislike yourself");
    }

    const existingLike = await likesRepository.findLike(
      liker_user_id,
      likee_user_id
    );

    // Check if you already unliked the user
    if (existingLike.is_like === false) {
      throw new Error("You already unliked this user");
    }

    let match = null;
    if (existingLike) {
      // update it to dislike
      match = await likesService.updateLikeStatus({
        user_id: liker_user_id,
        likee_user_id: likee_user_id,
        data: { is_like: false },
      });

      // Send notification to the user
      await notificationService.createAndSend({
        entity_type: NOTIFICATION_ENTITY_TYPE.UNLIKE,
        entity_id: liker_user_id,
        status: NOTIFICATION_STATUS.SENT,
        receivers: [likee_user_id],
        sender: liker_user_id,
      });
    } else {
      // add a new dislike
      match = await likesRepository.add(liker_user_id, likee_user_id, false);
    }

    // Update fame rating
    const likedProfile = await profilesRepository.findOne(likee_user_id);
    let fame_rating = likedProfile.fame_rating - 1;
    await profilesService.updateProfile({
      data: { fame_rating: fame_rating },
      user_id: likee_user_id,
    });

    return {
      ...match,
      both_matched: false,
    };
  },

  async unlikeUser(
    liker_user_id: string,
    likee_user_id: string
  ): Promise<Match> {
    // Check if the user is unliking themselves
    if (liker_user_id === likee_user_id) {
      throw new Error("You cannot dislike yourself");
    }

    // Check if the like already exists
    const existingLike = await likesRepository.findOne(
      liker_user_id,
      likee_user_id
    );
    if (!existingLike) {
      throw new Error("You haven't liked this user");
    }

    // Proceed with removal if validations pass
    const deletedMatch = await likesRepository.remove(
      liker_user_id,
      likee_user_id
    );

    // Return match status, ensuring `both_matched` is false after unlike
    return { ...deletedMatch, both_matched: false };
  },

  async updateLikeStatus({ user_id, likee_user_id, data }): Promise<Match> {
    // Check if the user is trying to update themselves
    if (user_id === likee_user_id) {
      throw new Error("You cannot update yourself");
    }

    // Check if the like already exists
    const existingLike = await likesRepository.findLike(user_id, likee_user_id);
    if (!existingLike) {
      throw new Error("You haven't liked this user");
    }

    // Update the like status
    const updatedMatch = await likesRepository.update({
      user_id,
      likee_user_id,
      is_like: data.is_like,
    });

    // Check for mutual "like" status
    const existingMutualLike = await likesRepository.findLike(
      likee_user_id,
      user_id
    );
    const bothMatched = existingMutualLike && data.is_like;

    return {
      ...updatedMatch,
      both_matched: bothMatched,
    };
  },
};

export const interestsService = {
  async addInterests(user_id: string, interests: string[]): Promise<Profile> {
    // Check total number of interests
    const currentInterestCount = await interestsRepository.countInterests(
      user_id
    );
    if (currentInterestCount + interests.length > 30) {
      throw new Error("Cannot have more than 30 interests");
    }

    // Check for existing interests
    const existingInterests = await interestsRepository.getUserInterests(
      user_id
    );
    if (
      existingInterests.some((interest) =>
        interests.includes(interest.interest_tag)
      )
    ) {
      throw new Error("At least one of the interests already exists");
    }

    // If all checks pass, add interests
    await interestsRepository.add(user_id, interests);

    // Return the updated profile
    return await profilesService.getProfile(user_id);
  },
};

export const blockedUsersService = {
  async blockUser(
    blocker_user_id: string,
    blocked_user_id: string
  ): Promise<BlockedUser> {
    // Check if the user is blocking themselves
    if (blocker_user_id === blocked_user_id) {
      throw new Error("You cannot block yourself");
    }

    // Check if the block already exists
    const existingBlockedUser = await blockedUsersRepository.findOne(
      blocker_user_id,
      blocked_user_id
    );
    if (existingBlockedUser) {
      throw new Error("You already blocked this user");
    }

    // Proceed with blocking if validations pass
    return blockedUsersRepository.add(blocker_user_id, blocked_user_id);
  },

  async unblockUser(
    blocker_user_id: string,
    blocked_user_id: string
  ): Promise<BlockedUser> {
    // Check if the user is unblocking themselves
    if (blocker_user_id === blocked_user_id) {
      throw new Error("You cannot unblock yourself");
    }

    // Check if the block exists
    const existingBlockedUser = await blockedUsersRepository.findOne(
      blocker_user_id,
      blocked_user_id
    );
    if (!existingBlockedUser) {
      throw new Error("You haven't blocked this user");
    }

    // Proceed with unblocking if validations pass
    return blockedUsersRepository.remove(blocker_user_id, blocked_user_id);
  },
};
