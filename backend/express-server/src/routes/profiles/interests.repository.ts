import db, { pgp } from "../../config/db-config.js";
import { Interest } from "./interests.interface.js";
import { Profile } from "./profiles.interface.js";
import { profilesRepository } from "./profiles.repository.js";

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

    return await profilesRepository.findOne(user_id);
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

    return await profilesRepository.findOne(user_id);
  },
};
