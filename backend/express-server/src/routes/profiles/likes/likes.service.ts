import {
  NOTIFICATION_ENTITY_TYPE,
  NOTIFICATION_STATUS,
} from "../../notifications/notification.interface.js";
import { notificationService } from "../../notifications/notifications.service.js";
import { Match } from "./matchs.interface.js";
import { profilesRepository } from "../profiles.repository.js";
import { profilesService } from "../profiles.service.js";
import { likesRepository } from "./likes.repository.js";

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
      match = await likesRepository.like(liker_user_id, likee_user_id);
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

    // Atomically increment fame rating of liked user
    await profilesRepository.incrementFameRating(likee_user_id, 1);

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
      match = await likesRepository.like(liker_user_id, likee_user_id, false);
    }

    // Atomically decrement fame rating of liked user
    await profilesRepository.incrementFameRating(likee_user_id, -1);

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
