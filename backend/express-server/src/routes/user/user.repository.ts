import db from "../../config/db-config.js";
import { Account } from "./user.interface.js";

interface FindOneInput {
  id?: string;
  username?: string;
  email?: string;
}

export const accountRepository = {
  /**
   *
   * @returns  If the user is found, return the user. Otherwise, return null.
   */
  findOne: async function findOne(
    input: FindOneInput
  ): Promise<Account | null> {
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

    let user: Account = data[0];

    return user;
  },
};
