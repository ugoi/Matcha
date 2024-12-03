import { BlockedUser } from "../likes/matchs.interface.js";
import { blockedUsersRepository } from "./blocks.repository.js";

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
