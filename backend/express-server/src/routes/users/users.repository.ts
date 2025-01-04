import { update } from "lodash";
import db, { pgp } from "../../config/db-config.js";
import { CreateUserInput, UpdateUserInput, User } from "./users.interface.js";
import { ColumnSet } from "pg-promise";

interface FindOneInput {
  id?: string;
  username?: string;
  email?: string;
}

export const userRepository = {
  /**
   *
   * @returns  If the user is found, return the user. Otherwise, return null.
   */
  findOne: async function findOne(input: FindOneInput): Promise<User | null> {
    const { id, username, email } = input;

    // Initialize query and values array
    let query = "false";
    const values = [];
    let index = 1;

    // Conditionally add clauses based on parameters provided
    if (id) {
      query += ` OR user_id = $${index}`;
      values.push(id);
      index++;
    }
    if (email) {
      query += ` OR email = $${index}`;
      values.push(email);
      index++;
    }
    if (username) {
      query += ` OR username = $${index}`;
      values.push(username);
      index++;
    }

    const data = await db.manyOrNone(
      `
      SELECT *
      FROM users
      WHERE ${query}
      LIMIT 1
      `,
      values
    );

    if (data.length === 0) {
      return null;
    }

    let user: User = data[0];

    return user;
  },

  create: async function create(input: CreateUserInput): Promise<User> {
    const query = pgp.helpers.insert(input, null, "users") + "RETURNING *";

    const userData = await db.one(query);

    return userData;
  },

  update: async function update(input: UpdateUserInput): Promise<User> {
    const { update } = pgp.helpers;

    const condition = pgp.as.format("WHERE user_id = ${user_id}", input);

    let query = `${update(input.data, null, "users")}
    ${condition}
    RETURNING *`;

    let updatedProfile = await db.one(query);

    return updatedProfile;
  },

  delete: async function deleteProfile(user_id: string): Promise<User> {
    let deletedProfile = await db.one(
      `
        DELETE FROM users
        WHERE user_id = $1
        RETURNING *
      `,
      [user_id]
    );

    return deletedProfile;
  },
};
