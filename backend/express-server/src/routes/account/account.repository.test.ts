// sum.test.js
import { test } from "vitest";
import db from "../../config/db-config.js";
import { newDb } from "pg-mem";
import { log } from "console";

// @ts-ignore
// const pg = newDb.adapters.createPgPromise();

test("adds 1 + 2 to equal 3", async () => {
  // const sql = `
  // CREATE TABLE accounts (user_id SERIAL PRIMARY KEY, username VARCHAR(255), email VARCHAR(255), is_email_verified BOOLEAN);
  // INSERT INTO accounts (username, email, is_email_verified) VALUES ('test', 'test', true), ('unverified', 'unverified', false
  // `;
  // await pg.none(sql);

  // const sql2 = `SELECT * FROM accounts WHERE username = 'test' AND email = 'test'`;

  // const result = await db.manyOrNone(sql2);

  // log(result);
});
