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

    if (data.length == 0) {
      return null;
    }

    const userInterests = await interestsRepository.find(data[0].user_id);

    const userPictures = await picturesRepository.find(data[0].user_id);

    const searchPreferences = await searchPreferencesRepository.find(
      data[0].user_id
    );

    if (data.length === 0) {
      return null;
    }

    let profile: Profile = {
      ...data[0],
      interests: userInterests,
      pictures: userPictures,
      search_preferences: searchPreferences,
    };

    return profile;
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
          ON (profiles.user_id = likes.matched_user_id AND likes.matcher_user_id = $2)
          WHERE likes.matcher_user_id IS NULL
        LIMIT 
          20
      ) 
      SELECT 
        * 
      FROM 
        profile_with_interests 
      $4:raw
      $5:raw
      `,
      [user_id, user_id, user_id, where, order_by]
    );

    return data;
  },

  create: async function create(input: CreateProfileInput): Promise<Profile> {
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

  update: async function update(input: UpdateProfileInput): Promise<Profile> {
    const { gps_latitude, gps_longitude } = input.data;

    // Remove gps fields from input.data as they're being handled separately
    delete input.data.gps_latitude;
    delete input.data.gps_longitude;

    // Create a raw SQL expression for the location field using ST_Point

    let locationRawSQL = undefined;

    if (gps_latitude && gps_longitude) {
      locationRawSQL = pgp.as.format("st_point($1, $2)", [
        gps_longitude,
        gps_latitude,
      ]);
    }

    let extendedData = { ...input.data, location: locationRawSQL };

    // Filter out undefined fields and add the raw SQL expression for location
    const transformedData = {
      ...Object.fromEntries(
        Object.entries(extendedData).filter(([_, v]) => v !== undefined)
      ),
    };

    // Define the column set, marking `location` as raw
    const columns = new pgp.helpers.ColumnSet(
      Object.keys(transformedData).map((col) =>
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
    const updateStatement = pgp.helpers.update(transformedData, columns);

    // Add the condition for user_id
    const condition = pgp.as.format("WHERE user_id = $1", [input.user_id]);

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
    matcher_user_id: string,
    matched_user_id: string
  ): Promise<Match> {
    // Check if you are liking yourself
    if (matcher_user_id === matched_user_id) {
      throw new Error("You cannot like yourself");
    }

    // Check if you already liked the user
    const existingMatch = await db.oneOrNone(
      `
        SELECT likes.*, (SELECT json_agg (i)
        FROM (
        SELECT profiles.*, users.username, users.first_name, users.last_name
        FROM
        profiles
        INNER JOIN users
          ON profiles.user_id = users.user_id
        WHERE likes.matcher_user_id = profiles.user_id
        ) i) as matcher, (SELECT json_agg (i)
        FROM (
        SELECT profiles.*, users.username, users.first_name, users.last_name
        FROM
        profiles
        INNER JOIN users
          ON profiles.user_id = users.user_id
        WHERE likes.matched_user_id = profiles.user_id
        ) i) as matched
        FROM likes
        WHERE matcher_user_id = $1 AND matched_user_id = $2
      `,
      [matcher_user_id, matched_user_id]
    );

    if (existingMatch) {
      throw new Error("You already liked this user");
    }

    // Check if the user already liked you
    const existingMatch2 = await db.oneOrNone(
      `
        SELECT *
        FROM likes
        WHERE matcher_user_id = $2 AND matched_user_id = $1
      `,
      [matcher_user_id, matched_user_id]
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
        SELECT likes.*, (SELECT json_agg (i)
        FROM (
        SELECT profiles.*, users.username, users.first_name, users.last_name
        FROM
        profiles
        INNER JOIN users
          ON profiles.user_id = users.user_id
        WHERE likes.matcher_user_id = profiles.user_id
        ) i) as matcher, (SELECT json_agg (i)
        FROM (
        SELECT profiles.*, users.username, users.first_name, users.last_name
        FROM
        profiles
        INNER JOIN users
          ON profiles.user_id = users.user_id
        WHERE likes.matched_user_id = profiles.user_id
        ) i) as matched
        FROM likes
        WHERE matcher_user_id = $1 OR matched_user_id = $1
      `,
      [user_id]
    );

    return likes;
  },

  add: async function like(
    matcher_user_id: string,
    matched_user_id: string
  ): Promise<Match> {
    // Check if you are liking yourself
    if (matcher_user_id === matched_user_id) {
      throw new Error("You cannot like yourself");
    }

    // Check if you already liked the user
    const existingMatch = await db.oneOrNone(
      `
        SELECT *
        FROM likes
        WHERE matcher_user_id = $1 AND matched_user_id = $2
      `,
      [matcher_user_id, matched_user_id]
    );

    if (existingMatch) {
      throw new Error("You already liked this user");
    }

    // Check if the user already liked you
    const existingMatch2 = await db.oneOrNone(
      `
        SELECT *
        FROM likes
        WHERE matcher_user_id = $2 AND matched_user_id = $1
      `,
      [matcher_user_id, matched_user_id]
    );

    const insertedMatch = await db.one(
      `
        INSERT INTO likes (matcher_user_id, matched_user_id)
        VALUES ($1, $2)
        RETURNING *
      `,
      [matcher_user_id, matched_user_id]
    );

    if (existingMatch2) {
      return {
        ...insertedMatch,
        both_matched: true,
      };
    } else {
      return {
        ...insertedMatch,
        both_matched: false,
      };
    }
  },

  remove: async function remove(
    matcher_user_id: string,
    matched_user_id: string
  ): Promise<Match> {
    // Check if you are unliking yourself
    if (matcher_user_id === matched_user_id) {
      throw new Error("You cannot unlike yourself");
    }

    // Check if you already liked the user
    const existingMatch = await db.oneOrNone(
      `
        SELECT *
        FROM likes
        WHERE matcher_user_id = $1 AND matched_user_id = $2
      `,
      [matcher_user_id, matched_user_id]
    );

    if (!existingMatch) {
      throw new Error("You haven't liked this user");
    }

    const deletedMatch = await db.one(
      `
        DELETE FROM likes
        WHERE matcher_user_id = $1 AND matched_user_id = $2
        RETURNING *
      `,
      [matcher_user_id, matched_user_id]
    );

    return {
      ...deletedMatch,
      both_matched: true,
    };
  },

  findMatches: async function findMatches(user_id: string): Promise<Match[]> {
    const likes = await db.manyOrNone(
      `
        SELECT m1.*, (SELECT json_agg (i)
        FROM (
        SELECT profiles.*, users.username, users.first_name, users.last_name
        FROM
        profiles
        INNER JOIN users
          ON profiles.user_id = users.user_id
        WHERE m1.matcher_user_id = profiles.user_id
        ) i) as matcher, (SELECT json_agg (i)
        FROM (
        SELECT profiles.*, users.username, users.first_name, users.last_name
        FROM
        profiles
        INNER JOIN users
          ON profiles.user_id = users.user_id
        WHERE m1.matched_user_id = profiles.user_id
        ) i) as matched
        FROM likes m1
        JOIN likes m2
          ON m1.matcher_user_id = m2.matched_user_id
          AND m1.matched_user_id = m2.matcher_user_id
        WHERE m1.matcher_user_id = $1
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

    if (existingBlockedUser) {
      throw new Error("You already blocked this user");
    }

    // Check if the user already blocked you
    const existingBlockedUser2 = await db.oneOrNone(
      `
        SELECT *
        FROM blocked_users
        WHERE blocker_user_id = $2 AND blocked_user_id = $1
      `,
      [blocker_user_id, blocked_user_id]
    );

    if (existingBlockedUser2) {
      return {
        ...existingBlockedUser,
        both_blocked: true,
      };
    } else {
      return {
        ...existingBlockedUser,
        both_blocked: false,
      };
    }
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
    // Check if you are liking yourself
    if (blocker_user_id === blocked_user_id) {
      throw new Error("You cannot block yourself");
    }

    // Check if you already blocked the user
    const existingBlockedUser = await db.oneOrNone(
      `
        SELECT *
        FROM blocked_users
        WHERE blocker_user_id = $1 AND blocked_user_id = $2
      `,
      [blocker_user_id, blocked_user_id]
    );

    if (existingBlockedUser) {
      throw new Error("You already blocked this user");
    }

    // Check if the user already blocked you
    const existingBlockedUser2 = await db.oneOrNone(
      `
        SELECT *
        FROM blocked_users
        WHERE blocker_user_id = $2 AND blocked_user_id = $1
      `,
      [blocker_user_id, blocked_user_id]
    );

    const insertedBlockedUser = await db.one(
      `
        INSERT INTO blocked_users (blocker_user_id, blocked_user_id)
        VALUES ($1, $2)
        RETURNING *
      `,
      [blocker_user_id, blocked_user_id]
    );

    if (existingBlockedUser2) {
      return {
        ...insertedBlockedUser,
        both_blocked: true,
      };
    } else {
      return {
        ...insertedBlockedUser,
        both_blocked: false,
      };
    }
  },

  remove: async function remove(
    blocker_user_id: string,
    blocked_user_id: string
  ): Promise<BlockedUser> {
    // Check if you are unliking yourself
    if (blocker_user_id === blocked_user_id) {
      throw new Error("You cannot unblock yourself");
    }

    // Check if you already blocked the user
    const existingBlockedUser = await db.oneOrNone(
      `
        SELECT *
        FROM blocked_users
        WHERE blocker_user_id = $1 AND blocked_user_id = $2
      `,
      [blocker_user_id, blocked_user_id]
    );

    if (!existingBlockedUser) {
      throw new Error("You haven't blocked this user");
    }

    const deletedBlockedUser = await db.one(
      `
        DELETE FROM blocked_users
        WHERE blocker_user_id = $1 AND blocked_user_id = $2
      `,
      [blocker_user_id, blocked_user_id]
    );

    return {
      ...deletedBlockedUser,
      both_blocked: true,
    };
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

  add: async function add(
    reporter_user_id: string,
    reported_user_id: string,
    report_reason: string
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
        INSERT INTO user_reports (reporter_user_id, reported_user_id, report_reason)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [reporter_user_id, reported_user_id, report_reason]
    );

    return insertedReport;
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
