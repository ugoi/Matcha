import db from "../../../config/db-config.js";
import { ValidationError } from "../../../error-handlers/custom-errors.js";
import { BlockedUser } from "../likes/matchs.interface.js";

export const blockedUsersRepository = {
  /**
   *  Check if you already blocked the user
   *
   * @param blocker_user_id
   * @param blocked_user_id
   * @returns
   */
  findOne: async function findOne(
    blocker_user_id: string,
    blocked_user_id: string
  ): Promise<BlockedUser> {
    // Check if user ids are valid
    if (!blocker_user_id) {
      throw new ValidationError("blocker_user_id can't be null");
    }
    // Check if user ids are valid
    if (!blocked_user_id) {
      throw new ValidationError("blocked_user_id can't be null");
    }

    // Check if you already blocked the user
    const existingBlockedUser = await db.oneOrNone(
      `
          SELECT blocked_users.*, (SELECT json_agg (i)
          FROM (
          SELECT profiles.*, users.username, users.first_name, users.last_name
          FROM
          profiles
          INNER JOIN users
            ON profiles.user_id = users.user_id
          WHERE blocked_users.blocker_user_id = profiles.user_id
          ) i) as blocker, (SELECT json_agg (i)
          FROM (
          SELECT profiles.*, users.username, users.first_name, users.last_name
          FROM
          profiles
          INNER JOIN users
            ON profiles.user_id = users.user_id
          WHERE blocked_users.blocked_user_id = profiles.user_id
          ) i) as blocked
          FROM blocked_users
          WHERE blocker_user_id = $1 AND blocked_user_id = $2
        `,
      [blocker_user_id, blocked_user_id]
    );

    return existingBlockedUser;
  },

  find: async function find(user_id: string): Promise<BlockedUser[]> {
    const blocked_users = await db.manyOrNone(
      `
          SELECT blocked_users.*, (SELECT json_agg (i)
          FROM (
          SELECT profiles.*, users.username, users.first_name, users.last_name
          FROM
          profiles
          INNER JOIN users
            ON profiles.user_id = users.user_id
          WHERE blocked_users.blocker_user_id = profiles.user_id
          ) i) as blocker, (SELECT json_agg (i)
          FROM (
          SELECT profiles.*, users.username, users.first_name, users.last_name
          FROM
          profiles
          INNER JOIN users
            ON profiles.user_id = users.user_id
          WHERE blocked_users.blocked_user_id = profiles.user_id
          ) i) as blocked
          FROM blocked_users
          WHERE blocker_user_id = $1 OR blocked_user_id = $1
        `,
      [user_id]
    );

    return blocked_users;
  },

  add: async function add(
    blocker_user_id: string,
    blocked_user_id: string
  ): Promise<BlockedUser> {
    const insertedBlockedUser = await db.one(
      `
          INSERT INTO blocked_users (blocker_user_id, blocked_user_id)
          VALUES ($1, $2)
          RETURNING *
        `,
      [blocker_user_id, blocked_user_id]
    );

    return insertedBlockedUser;
  },

  async remove(
    blocker_user_id: string,
    blocked_user_id: string
  ): Promise<BlockedUser> {
    return await db.one(
      `
        DELETE FROM blocked_users
        WHERE blocker_user_id = $1 AND blocked_user_id = $2
        RETURNING *
        `,
      [blocker_user_id, blocked_user_id]
    );
  },
};
