const pgp = require("pg-promise")(/* options */);
const cn = {
  host: "aws-0-eu-central-2.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.xfutqhawurxfjauhpybh",
  password: "cBp8vaVFJ6ST14UM",
  max: 30, // use up to 30 connections
  // "types" - in case you want to set custom type parsers on the pool level
};

// Creating a new database instance from the connection details:
const db = pgp(cn);

// Exporting the database object for shared use:
module.exports = db;
