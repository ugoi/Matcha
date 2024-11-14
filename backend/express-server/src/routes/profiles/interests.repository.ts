import db, { pgp } from "../../config/db-config.js";
import { Interest } from "./interests.interface.js";
import { Profile } from "./profiles.interface.js";
import { profilesRepository } from "./profiles.repository.js";
import { profilesService } from "./profiles.service.js";

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
  async countInterests(user_id: string): Promise<number> {
    const result = await db.one(
      `
      SELECT COUNT(*) AS count
      FROM user_interests
      WHERE user_id = $1
      `,
      [user_id]
    );
    return parseInt(result.count);
  },

  async getUserInterests(user_id: string): Promise<{ interest_tag: string }[]> {
    return await db.manyOrNone(
      `
      SELECT interest_tag
      FROM user_interests
      WHERE user_id = $1
      `,
      [user_id]
    );
  },

  async add(user_id: string, interests: string[]): Promise<void> {
    const cs = new pgp.helpers.ColumnSet(["user_id", "interest_tag"], {
      table: "user_interests",
    });

    const data = interests.map((interest) => ({
      user_id,
      interest_tag: interest,
    }));

    const insert = pgp.helpers.insert(data, cs);
    await db.none(insert);
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

    return await profilesService.getProfile(user_id);
  },
};
