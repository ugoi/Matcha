import db from "../../db-object.js";

interface FindOneInput {
  id?: string;
  username?: string;
  email?: string;
}

export const accountRepository = {
  findOne: async function findOne(input: FindOneInput) {
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
      FROM accounts
      WHERE ${query}
      LIMIT 1
      `,
      values
    );

    if (data.length === 0) {
      return null;
    }

    return data[0];
  },
};
