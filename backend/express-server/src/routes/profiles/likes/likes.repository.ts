import db from "../../../config/db-config.js";
import { Match } from "./matchs.interface.js";

export const likesRepository = {
  async findOne(liker_user_id: string, likee_user_id: string): Promise<Match> {
    // Check if you are liking yourself
    if (liker_user_id === likee_user_id) {
      throw new Error("You cannot like yourself");
    }

    const existingMatch = await db.oneOrNone(
      `
          SELECT likes.*, (SELECT json_agg (i)
          FROM (
          SELECT profiles.*, users.username, users.first_name, users.last_name
          FROM
          profiles
          INNER JOIN users
            ON profiles.user_id = users.user_id
          WHERE likes.liker_user_id = profiles.user_id
          ) i) as matcher, (SELECT json_agg (i)
          FROM (
          SELECT profiles.*, users.username, users.first_name, users.last_name
          FROM
          profiles
          INNER JOIN users
            ON profiles.user_id = users.user_id
          WHERE likes.likee_user_id = profiles.user_id
          ) i) as matched
          FROM likes
          WHERE liker_user_id = $1 AND likee_user_id = $2
        `,
      [liker_user_id, likee_user_id]
    );

    // Check if the user already liked you
    const existingMatch2 = await db.oneOrNone(
      `
          SELECT *
          FROM likes
          WHERE liker_user_id = $2 AND likee_user_id = $1
        `,
      [liker_user_id, likee_user_id]
    );

    if (existingMatch2) {
      return {
        ...existingMatch,
        both_matched: true,
      };
    } else {
      return {
        ...existingMatch,
        both_matched: false,
      };
    }
  },

  async find(user_id: string): Promise<Match[]> {
    const likes = await db.manyOrNone(
      `
        SELECT 
          likes.*, 
          (
            SELECT 
              json_agg (i) 
            FROM 
              (
                SELECT 
                  profiles.*, 
                  users.username, 
                  users.first_name, 
                  users.last_name,
                  blocked.blocked_user_id IS NOT NULL as is_blocked_by_me,
                  blocker.blocker_user_id IS NOT NULL as is_blocking_me
                FROM 
                  profiles 
                  INNER JOIN users ON profiles.user_id = users.user_id
                  LEFT JOIN blocked_users blocked ON (profiles.user_id = blocked.blocked_user_id AND blocked.blocker_user_id = $1)
                  LEFT JOIN blocked_users blocker ON (profiles.user_id = blocker.blocker_user_id AND blocker.blocked_user_id = $1)
                WHERE 
                  likes.liker_user_id = profiles.user_id
                    AND likes.is_like = TRUE
              ) i
          ) as matcher, 
          (
            SELECT 
              json_agg (i) 
            FROM 
              (
                SELECT 
                  profiles.*, 
                  users.username, 
                  users.first_name, 
                  users.last_name,
                  blocked.blocked_user_id IS NOT NULL as is_blocked_by_me,
                  blocker.blocker_user_id IS NOT NULL as is_blocking_me
                FROM 
                  profiles 
                  INNER JOIN users ON profiles.user_id = users.user_id
                  LEFT JOIN blocked_users blocked ON (profiles.user_id = blocked.blocked_user_id AND blocked.blocker_user_id = $1)
                  LEFT JOIN blocked_users blocker ON (profiles.user_id = blocker.blocker_user_id AND blocker.blocked_user_id = $1)
                WHERE 
                  likes.likee_user_id = profiles.user_id
                    AND likes.is_like = TRUE
              ) i
          ) as matched 
        FROM 
          likes 
        WHERE 
          (liker_user_id = $1 
            OR likee_user_id = $1)
              AND is_like = TRUE
        `,
      [user_id]
    );

    return likes;
  },

  async like(
    liker_user_id: string,
    likee_user_id: string,
    is_like: boolean = true
  ): Promise<Match> {
    const insertedMatch = await db.one(
      `
          INSERT INTO likes (liker_user_id, likee_user_id, is_like)
          VALUES ($1, $2, $3)
          RETURNING *
        `,
      [liker_user_id, likee_user_id, is_like]
    );

    return insertedMatch;
  },

  async remove(liker_user_id: string, likee_user_id: string): Promise<Match> {
    return await db.one(
      `
        DELETE FROM likes
        WHERE liker_user_id = $1 AND likee_user_id = $2
        RETURNING *
        `,
      [liker_user_id, likee_user_id]
    );
  },

  async findLike(
    liker_user_id: string,
    likee_user_id: string
  ): Promise<Match | null> {
    return await db.oneOrNone(
      `
        SELECT *
        FROM likes
        WHERE liker_user_id = $1 AND likee_user_id = $2
        `,
      [liker_user_id, likee_user_id]
    );
  },

  async update({ user_id, likee_user_id, is_like }): Promise<Match> {
    return await db.one(
      `
        UPDATE likes
        SET is_like = $1
        WHERE liker_user_id = $2 AND likee_user_id = $3
        RETURNING *
        `,
      [is_like, user_id, likee_user_id]
    );
  },

  async findMatches(user_id: string): Promise<Match[]> {
    const likes = await db.manyOrNone(
      `
        SELECT 
          m1.*, 
          (
            SELECT 
              json_agg (i) 
            FROM 
              (
                SELECT 
                  profiles.*, 
                  users.username, 
                  users.first_name, 
                  users.last_name 
                FROM 
                  profiles 
                  INNER JOIN users ON profiles.user_id = users.user_id 
                WHERE 
                  m1.liker_user_id = profiles.user_id
              ) i
          ) as matcher, 
          (
            SELECT 
              json_agg (i) 
            FROM 
              (
                SELECT 
                  profiles.*, 
                  users.username, 
                  users.first_name, 
                  users.last_name 
                FROM 
                  profiles 
                  INNER JOIN users ON profiles.user_id = users.user_id 
                WHERE 
                  m1.likee_user_id = profiles.user_id
              ) i
          ) as matched 
        FROM 
          likes m1 
          JOIN likes m2 ON m1.liker_user_id = m2.likee_user_id 
          AND m1.likee_user_id = m2.liker_user_id 
        WHERE 
          m1.liker_user_id = $1
            AND m1.is_like = TRUE AND m2.is_like = TRUE
        `,
      [user_id]
    );

    return likes;
  },
};
