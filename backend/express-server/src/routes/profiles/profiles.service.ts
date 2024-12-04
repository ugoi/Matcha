import db, { pgp } from "../../config/db-config.js";
import { JError, JFail } from "../../error-handlers/custom-errors.js";
import { FilterSet, SortSet } from "../../utils/utils.js";
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
  profilesRepository,
  searchPreferencesRepository,
} from "./profiles.repository.js";
import { interestsRepository } from "./interests/interests.repository.js";
import { picturesRepository } from "./pictures/pictures.repository.js";
import { Picture } from "./pictures/pictures.interface.js";

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
        `Profile picture not found in user pictures - Please upload the pictures first with POST ${process.env.BASE_URL}/api/profiles/me/pictures`
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
        `Profile picture not found in user pictures - Please upload the pictures first with POST ${process.env.BASE_URL}/api/profiles/me/pictures/${picture_id}`
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
