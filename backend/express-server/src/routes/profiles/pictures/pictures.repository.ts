import db, { pgp } from "../../../config/db-config.js";
import { ValidationError } from "../../../error-handlers/custom-errors.js";
import { Picture } from "./pictures.interface.js";

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
  ): Promise<Picture[]> {
    // Creating a reusable/static ColumnSet for generating INSERT queries:
    const cs = new pgp.helpers.ColumnSet(["user_id", "picture_url"], {
      table: "user_pictures",
    });

    const data = pictures.map((picture) => ({
      user_id: user_id,
      picture_url: picture,
    }));

    const insertQuery = pgp.helpers.insert(data, cs) + " RETURNING *";

    return await db.tx(async (t) => {
      // Check current picture count
      const currentPictures = await t.manyOrNone(
        `
        SELECT COUNT(*) as count 
        FROM user_pictures 
        WHERE user_id = $1
        `,
        [user_id]
      );

      const currentCount = parseInt(currentPictures[0].count);

      if (currentCount + pictures.length > 5) {
        throw new ValidationError("Maximum 5 pictures allowed");
      }

      // Insert new pictures
      const insertedRows = await t.manyOrNone(insertQuery);

      // Return updated pictures
      return insertedRows;
    });
  },

  remove: async function remove(
    user_id: string,
    pictures: string[]
  ): Promise<Picture[]> {
    // Creating a reusable/static ColumnSet for generating INSERT queries:
    const cs = new pgp.helpers.ColumnSet(["user_id", "picture_url"], {
      table: "user_pictures",
    });

    const data = pictures.map((picture) => ({
      user_id: user_id,
      picture_url: picture,
    }));

    const values = pgp.helpers.values(data, cs);

    const preparedStatement = pgp.as.format(
      ` 
      DELETE FROM user_pictures
      WHERE (user_id, picture_url) IN ($1:raw)
      RETURNING *
      `,
      [values]
    );

    const result = await db.manyOrNone(preparedStatement);

    return result;
  },
};
