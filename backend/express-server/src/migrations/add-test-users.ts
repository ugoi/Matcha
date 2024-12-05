import fs from "node:fs";
import db from "../config/db-config.js";
import { join } from "path";
const __dirname = import.meta.dirname;

export async function up() {
  const addTestUsersSql = fs.readFileSync(
    join(__dirname, "../../sql/add-test-users.sql"),
    "utf8"
  );

  await db.none(addTestUsersSql);
}
