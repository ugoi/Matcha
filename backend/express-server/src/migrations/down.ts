import fs from "node:fs";
import db from "../config/db-config.js";
import { join } from "path";
const __dirname = import.meta.dirname;

export async function down() {
  const sql = fs.readFileSync(join(__dirname, "../../sql/down.sql"), "utf8");

  await db.none(sql);
}
