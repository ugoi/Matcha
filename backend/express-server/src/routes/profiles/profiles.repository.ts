import db, { pgp } from "../../config/db-config.js";
import {
  CreateProfileInput,
  Profile,
  SearchPreferences,
  UpdateProfileInput,
} from "./profiles.interface.js";
import { Interest } from "./interests.interface.js";
import { Picture } from "./pictures.interface.js";
import { BlockedUser, Match, UserReport } from "./matchs.interface.js";
import { interestsRepository } from "./interests.repository.js";
import { picturesRepository } from "./pictures.repository.js";
import { JError, JFail } from "../../error-handlers/custom-errors.js";
import { find, update } from "lodash";

export const profilesRepository = {
  /**
   *
   * @returns  If the profile is found, return the profile. Otherwise, return null.
   */
  findOne: async function findOne(search: string): Promise<Profile | null> {
    const data = await db.manyOrNone(
      `
      SELECT profiles.*, users.username, users.first_name, users.last_name, st_y(location::geometry) as gps_latitude, st_x(location::geometry) as gps_longitude
      FROM profiles
      INNER JOIN users
        ON profiles.user_id = users.user_id
      WHERE $1 in (profiles.user_id, users.username, users.email)
      LIMIT 1
      `,
      search
    );

    return data.length > 0 ? data[0] : null;
  },

  find: async function find(
    user_id: string,
    where?: string,
    order_by?: string
  ): Promise<Profile[]> {
    if (!where) {
      where = "";
    }

    if (!order_by) {
      order_by = "";
    }
    const data = await db.manyOrNone(
      `
      WITH profile_with_interests AS (
        SELECT 
          profiles.*, 
          users.username, 
          users.first_name, 
          users.last_name, 
          array_length(
            ARRAY(
              SELECT 
                interest_tag 
              FROM 
                user_interests AS ui 
              WHERE 
                ui.user_id = profiles.user_id 
              INTERSECT 
              SELECT 
                interest_tag 
              FROM 
                user_interests AS uime 
              WHERE 
                uime.user_id = $1
            ), 
            1
          ) AS common_interests, 
          (
            SELECT 
              json_agg (i) 
            FROM 
              (
                SELECT 
                  * 
                FROM 
                  user_interests 
                WHERE 
                  user_interests.user_id = profiles.user_id
              ) i
          ) as interests, 
          (
            SELECT 
              json_agg (i) 
            FROM 
              (
                SELECT 
                  * 
                FROM 
                  user_pictures 
                WHERE 
                  user_pictures.user_id = profiles.user_id
              ) i
          ) as pictures 
        FROM 
          profiles 
          INNER JOIN users ON profiles.user_id = users.user_id 
          LEFT JOIN likes
          ON (profiles.user_id = likes.likee_user_id AND likes.liker_user_id = $1)
          LEFT JOIN blocked_users
          ON (profiles.user_id = blocked_users.blocked_user_id AND blocked_users.blocker_user_id = $1)
          WHERE likes.liker_user_id IS NULL AND blocked_users.blocker_user_id IS NULL
        LIMIT 
          20
      ) 
      SELECT 
        * 
      FROM 
        profile_with_interests 
      $2:raw
      $3:raw
      `,
      [user_id, where, order_by]
    );

    return data;
  },

  create: async function create(input: CreateProfileInput): Promise<Profile> {
    const { user_id, data } = input;

    const statement = pgp.as.format(
      `
      INSERT INTO profiles (user_id, gender, age, sexual_preference, biography, profile_picture, location)
      VALUES ($1, $2, $3, $4, $5, $6, st_point($7, $8))
    `,
      [
        user_id,
        data.gender,
        data.age,
        data.sexual_preference,
        data.biography,
        data.profile_picture,
        data.gps_longitude,
        data.gps_latitude,
      ]
    );

    let newProfile = await db.none(statement);

    return newProfile;
  },

  async update(input: { user_id: string; data: any }): Promise<Profile> {
    const { user_id, data } = input;

    // Define the column set, marking `location` as raw if it exists
    const columns = new pgp.helpers.ColumnSet(
      Object.keys(data).map((col) =>
        col === "location"
          ? {
              name: col,
              mod: "^",
            }
          : col
      ),
      { table: "profiles" }
    );

    // Generate the SQL update statement
    const updateStatement = pgp.helpers.update(data, columns);

    // Add the condition for user_id
    const condition = pgp.as.format("WHERE user_id = $1", [user_id]);

    // Full query
    const query = `${updateStatement} ${condition} RETURNING *`;

    // Execute the query and get the updated profile
    const updatedProfile = await db.one(query);

    return updatedProfile;
  },

  delete: async function deleteProfile(user_id: string): Promise<Profile> {
    let deletedProfile = await db.one(
      `
        DELETE FROM profiles
        WHERE user_id = $1
        RETURNING *
      `,
      [user_id]
    );

    return deletedProfile;
  },
};

export const searchPreferencesRepository = {
  find: async function find(user_id: string): Promise<SearchPreferences> {
    const searchPreferences = await db.oneOrNone(
      `
            SELECT *
            FROM search_preferences
            WHERE user_id = $1
        `,
      [user_id]
    );

    return searchPreferences;
  },

  update: async function update(
    user_id: string,
    searchPreferences: {
      min_age: number;
      max_age: number;
      max_distance: number;
    }
  ): Promise<SearchPreferences> {
    let updatedSearchPreferences = await db.one(
      `
            UPDATE search_preferences
            SET min_age = $1, max_age = $2, max_distance = $3
            WHERE user_id = $4
            RETURNING *
        `,
      [
        searchPreferences.min_age,
        searchPreferences.max_age,
        searchPreferences.max_distance,
        user_id,
      ]
    );

    return updatedSearchPreferences;
  },
};

export const likesRepository = {
  findOne: async function findOne(
    liker_user_id: string,
    likee_user_id: string
  ): Promise<Match> {
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

  find: async function find(user_id: string): Promise<Match[]> {
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
                users.last_name 
              FROM 
                profiles 
                INNER JOIN users ON profiles.user_id = users.user_id 
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
                users.last_name 
              FROM 
                profiles 
                INNER JOIN users ON profiles.user_id = users.user_id 
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

  add: async function like(
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

  findMatches: async function findMatches(user_id: string): Promise<Match[]> {
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

export const blockedUsersRepository = {
  findOne: async function findOne(
    blocker_user_id: string,
    blocked_user_id: string
  ): Promise<BlockedUser> {
    // Check if you are liking yourself
    if (blocker_user_id === blocked_user_id) {
      throw new Error("You cannot block yourself");
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

export const userReportsRepository = {
  findOne: async function findOne(
    reporter_user_id: string,
    reported_user_id: string
  ): Promise<UserReport> {
    // Check if you are reporting yourself
    if (reporter_user_id === reported_user_id) {
      throw new Error("You cannot report yourself");
    }

    // Check if you already reported the user
    const existingReport = await db.oneOrNone(
      `
        SELECT *
        FROM user_reports
        WHERE reporter_user_id = $1 AND reported_user_id = $2
      `,
      [reporter_user_id, reported_user_id]
    );

    if (existingReport) {
      throw new Error("You already reported this user");
    }

    const insertedReport = await db.one(
      `
        INSERT INTO user_reports (reporter_user_id, reported_user_id)
        VALUES ($1, $2)
        RETURNING *
      `,
      [reporter_user_id, reported_user_id]
    );

    return insertedReport;
  },

  find: async function find(user_id: string): Promise<UserReport[]> {
    const user_reports = await db.manyOrNone(
      `
        SELECT *
        FROM user_reports
        WHERE reporter_user_id = $1 OR reported_user_id = $1
      `,
      [user_id]
    );

    return user_reports;
  },

  async add(
    blocker_user_id: string,
    blocked_user_id: string,
    report_reason: string
  ): Promise<BlockedUser> {
    return await db.one(
      `
      INSERT INTO blocked_users (blocker_user_id, blocked_user_id, report_reason)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [blocker_user_id, blocked_user_id, report_reason]
    );
  },

  remove: async function remove(
    reporter_user_id: string,
    reported_user_id: string
  ): Promise<UserReport> {
    // Check if you are unliking yourself
    if (reporter_user_id === reported_user_id) {
      throw new Error("You cannot unreport yourself");
    }

    // Check if you already reported the user
    const existingReport = await db.oneOrNone(
      `
        SELECT *
        FROM user_reports
        WHERE reporter_user_id = $1 AND reported_user_id = $2
      `,
      [reporter_user_id, reported_user_id]
    );

    if (!existingReport) {
      throw new Error("You haven't reported this user");
    }

    const deletedReport = await db.one(
      `
        DELETE FROM user_reports
        WHERE reporter_user_id = $1 AND reported_user_id = $2
      `,
      [reporter_user_id, reported_user_id]
    );

    return deletedReport;
  },
};
