import { find, update } from "lodash";
import db, { pgp } from "../../config/db-config.js";
import { Profile, SearchPreferences } from "./profile.interface.js";
import { Interest } from "./interest.interface.js";
import { Picture } from "./picture.interface.js";
import { Match } from "./match.interface.js";

interface FindOneInput {
  user_id?: string;
  username?: string;
  email?: string;
}

interface UpdateProfileInput {
  user_id: string;
  data: {
    gender?: string;
    age?: number;
    sexual_preference?: string;
    biography?: string;
    profile_picture?: string;
    gps_latitude?: number;
    gps_longitude?: number;
  };
}

interface CreateProfileInput {
  user_id: string;
  data: {
    gender: string;
    age: number;
    sexual_preference: string;
    biography: string;
    profile_picture: string;
  };
}

export const profileRepository = {
  /**
   *
   * @returns  If the profile is found, return the profile. Otherwise, return null.
   */
  findOne: async function findOne(search: string): Promise<Profile | null> {
    const data = await db.manyOrNone(
      `
      SELECT profiles.*, users.username, users.first_name, users.last_name
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

  find: async function find(): Promise<Profile[]> {
    const data = await db.manyOrNone(
      `
  SELECT row_to_json(t)
  FROM (
    SELECT profiles.*, users.username, users.first_name, users.last_name, (SELECT json_agg (i)
    FROM (
    SELECT *
    FROM
    user_interests
    WHERE user_interests.user_id = profiles.user_id
    ) i) as interests, (SELECT json_agg (i)
    FROM (
    SELECT *
    FROM
    user_pictures
    WHERE user_pictures.user_id = user_pictures.user_id
    ) i) as pictures
    FROM profiles
    INNER JOIN users
      ON profiles.user_id = users.user_id
    LIMIT 20
  ) t;
      `
    );

    let profiles = data.map(async (profile) => {
      const userInterests = await interestsRepository.find(profile.user_id);

      const userPictures = await picturesRepository.find(profile.user_id);

      const searchPreferences = await searchPreferencesRepository.find(
        profile.user_id
      );

      return {
        ...profile,
        interests: userInterests,
        pictures: userPictures,
        search_preferences: searchPreferences,
      };
    });

    let result = Promise.all(profiles);

    return result;
  },

  create: async function create(input: CreateProfileInput): Promise<Profile> {
    const { user_id, data } = input;

    let newProfile = await db.one(
      `
        INSERT INTO profiles (user_id, gender, age, sexual_preference, biography, profile_picture)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        user_id,
        data.gender,
        data.age,
        data.sexual_preference,
        data.biography,
        data.profile_picture,
      ]
    );

    return newProfile;
  },

  update: async function update(input: UpdateProfileInput): Promise<Profile> {
    const { user_id, data } = input;

    let result: Profile;

    let updatedProfile = await db.one(
      `
        UPDATE profiles
        SET gender = $1, age = $2, sexual_preference = $3, biography = $4, profile_picture = $5, gps_latitude = $6, gps_longitude = $7
        WHERE user_id = $8
        RETURNING *
      `,
      [
        data.gender,
        data.age,
        data.sexual_preference,
        data.biography,
        data.profile_picture,
        data.gps_latitude,
        data.gps_longitude,
        user_id,
      ]
    );

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

export const interestsRepository = {
  find: async function find(user_id: string): Promise<Interest[]> {
    const interests = await db.manyOrNone(
      `
            SELECT *
            FROM user_interests
            WHERE user_id = $1
        `,
      [user_id]
    );

    return interests;
  },

  add: async function add(
    user_id: string,
    interests: string[]
  ): Promise<Profile> {
    // Check number of interests is less than 5
    const interestsCountResult = await db.one(
      `
            SELECT COUNT(*)
            FROM user_interests
            WHERE user_id = $1
        `,
      [user_id]
    );

    const interestsCount = parseInt(interestsCountResult.count);

    if (interestsCount + interests.length > 30) {
      throw new Error("Cannot have more than 30 interests");
    }

    // Check if interests already exist
    let existingInterests = await db.manyOrNone(
      `
            SELECT interest_tag
            FROM user_interests
            WHERE user_id = $1
        `,
      [user_id]
    );

    if (
      existingInterests.some((interest) =>
        interests.includes(interest.interest_tag)
      )
    ) {
      throw new Error("At least one of the interests already exists");
    }

    // Creating a reusable/static ColumnSet for generating INSERT queries:
    const cs = new pgp.helpers.ColumnSet(["user_id", "interest_tag"], {
      table: "user_interests",
    });

    const data = interests.map((interest) => ({
      user_id: user_id,
      interest_tag: interest,
    }));

    const insert = pgp.helpers.insert(data, cs);

    await db.none(insert);

    return await profileRepository.findOne(user_id);
  },

  remove: async function remove(
    user_id: string,
    interests: string[]
  ): Promise<Profile> {
    // Creating a reusable/static ColumnSet for generating INSERT queries:
    const cs = new pgp.helpers.ColumnSet(["user_id", "interest_tag"], {
      table: "user_interests",
    });

    const data = interests.map((interest) => ({
      user_id: user_id,
      interest_tag: interest,
    }));

    const values = pgp.helpers.values(data, cs);

    await db.none(
      `
            DELETE FROM user_interests
            WHERE (user_id, interest_tag) IN ($1:raw)
        `,
      [values]
    );

    return await profileRepository.findOne(user_id);
  },
};

export const picturesRepository = {
  find: async function find(user_id: string): Promise<Picture[]> {
    const pictures = await db.manyOrNone(
      `
            SELECT *
            FROM user_pictures
            WHERE user_id = $1
        `,
      [user_id]
    );

    return pictures;
  },

  add: async function add(
    user_id: string,
    pictures: string[]
  ): Promise<Profile> {
    // Check number of pictures is less than 5
    const picturesCountResult = await db.one(
      `
            SELECT COUNT(*)
            FROM user_pictures
            WHERE user_id = $1
        `,
      [user_id]
    );

    const picturesCount = parseInt(picturesCountResult.count);

    if (picturesCount + pictures.length > 5) {
      throw new Error("Cannot have more than 5 pictures");
    }

    // Check if pictures already exist
    let existingInterests = await db.manyOrNone(
      `
            SELECT picture_url
            FROM user_pictures
            WHERE user_id = $1
        `,
      [user_id]
    );

    if (
      existingInterests.some((picture) =>
        pictures.includes(picture.picture_url)
      )
    ) {
      throw new Error("At least one of the pictures already exists");
    }

    // Creating a reusable/static ColumnSet for generating INSERT queries:
    const cs = new pgp.helpers.ColumnSet(["user_id", "picture_url"], {
      table: "user_pictures",
    });

    const data = pictures.map((picture) => ({
      user_id: user_id,
      picture_url: picture,
    }));

    const insert = pgp.helpers.insert(data, cs);

    await db.none(insert);

    return await profileRepository.findOne(user_id);
  },

  remove: async function remove(
    user_id: string,
    pictures: string[]
  ): Promise<Profile> {
    // Creating a reusable/static ColumnSet for generating INSERT queries:
    const cs = new pgp.helpers.ColumnSet(["user_id", "picture_url"], {
      table: "user_pictures",
    });

    const data = pictures.map((picture) => ({
      user_id: user_id,
      picture_url: picture,
    }));

    const values = pgp.helpers.values(data, cs);

    await db.none(
      `
            DELETE FROM user_pictures
            WHERE (user_id, picture_url) IN ($1:raw)
        `,
      [values]
    );

    return await profileRepository.findOne(user_id);
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
        SELECT *
        FROM matches
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
        FROM matches
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
    const matches = await db.manyOrNone(
      `
        SELECT *
        FROM matches
        WHERE matcher_user_id = $1 OR matched_user_id = $1
      `,
      [user_id]
    );

    return matches;
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
        FROM matches
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
        FROM matches
        WHERE matcher_user_id = $2 AND matched_user_id = $1
      `,
      [matcher_user_id, matched_user_id]
    );

    const insertedMatch = await db.one(
      `
        INSERT INTO matches (matcher_user_id, matched_user_id)
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

  remove: async function unlike(
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
        FROM matches
        WHERE matcher_user_id = $1 AND matched_user_id = $2
      `,
      [matcher_user_id, matched_user_id]
    );

    if (!existingMatch) {
      throw new Error("You haven't liked this user");
    }

    const deletedMatch = await db.one(
      `
        DELETE FROM matches
        WHERE matcher_user_id = $1 AND matched_user_id = $2
      `,
      [matcher_user_id, matched_user_id]
    );

    return {
      ...deletedMatch,
      both_matched: true,
    };
  },

  findMatches: async function findMatches(user_id: string): Promise<Match[]> {
    const matches = await db.manyOrNone(
      `
        SELECT *
        FROM matches m1
        JOIN matches m2
          ON m1.matcher_user_id = m2.matched_user_id
          AND m1.matched_user_id = m2.matcher_user_id
        WHERE m1.matcher_user_id = $1
      `,
      [user_id]
    );

    return matches;
  },
};
