import db, { pgp } from "../../config/db-config.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import { FilterSet, picturesNotExists, SortSet } from "../../utils/utils.js";
import { Match } from "./matchs.interface.js";
import { Picture } from "./pictures.interface.js";
import { picturesRepository } from "./pictures.repository.js";
import { SearchPreferences } from "./profiles.interface.js";
import { likesRepository, profilesRepository } from "./profiles.repository.js";

export const profilesService = {
  searchProfiles: async function searchProfiles(filter: SearchPreferences) {
    if (filter.filter_by && Object.keys(filter.filter_by).length > 0) {
      var filterSet = new FilterSet(filter.filter_by);
      var where = pgp.as.format("WHERE $1", filterSet);
    }

    if (filter.sort_by && Object.keys(filter.sort_by).length > 0) {
      var sortSet = new SortSet(filter.sort_by);
      var order = pgp.as.format("ORDER BY $1", sortSet);
    }

    const users = await profilesRepository.find(filter.user_id, where, order);

    return users;
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
  like: async function like(
    liker_user_id: string,
    likee_user_id: string
  ): Promise<Match> {
    // Check if you are liking yourself
    if (liker_user_id === likee_user_id) {
      throw new Error("You cannot like yourself");
    }

    // Check if you already liked the user
    const existingLike = await likesRepository.findOne(
      liker_user_id,
      likee_user_id
    );
    if (existingLike.is_like === true) {
      throw new Error("You already liked this user");
    }

    let match = null;
    // If like exists update it to like
    if (existingLike) {
      match = await likesRepository.update({
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
    await profilesRepository.update({
      data: { fame_rating: fame_rating },
      user_id: likee_user_id,
    });

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

    // Check if you already liked the user
    // Check if like exists
    const existingLike = await likesRepository.findOne(
      liker_user_id,
      likee_user_id
    );
    if (existingLike.is_like === false) {
      throw new Error("You already unliked this user");
    }

    // If like exists update it to dislike
    let match = null;
    if (existingLike) {
      match = await likesRepository.update({
        user_id: liker_user_id,
        likee_user_id: likee_user_id,
        data: { is_like: false },
      });
    } else {
      match = await likesRepository.add(liker_user_id, likee_user_id, false);
    }

    // Calculate new fame rating
    const likedProfile = await profilesRepository.findOne(likee_user_id);
    let fame_rating = likedProfile.fame_rating - 1;
    // Increment fame rating of liked user
    await profilesRepository.update({
      data: { fame_rating: fame_rating },
      user_id: likee_user_id,
    });

    return {
      ...match,
      both_matched: false,
    };
  },
};
