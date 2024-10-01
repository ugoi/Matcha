import fs from "node:fs";
import db from "../db-object.js";
import { join } from "path";
const __dirname = import.meta.dirname;

export async function up() {
  const sql = fs.readFileSync(join(__dirname, "../../sql/up.sql"), "utf8");

  await db.none(sql);
}
