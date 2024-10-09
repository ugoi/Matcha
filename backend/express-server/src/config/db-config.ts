import pgPromise from "pg-promise";
const pgp = pgPromise({
  /* Initialization Options */
});
import "dotenv/config";
import { IConnectionParameters } from "pg-promise/typescript/pg-subset.js";
const cn: IConnectionParameters = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_MAX), // max number of clients in the pool
  // "types" - in case you want to set custom type parsers on the pool level
};

// Creating a new database instance from the connection details:
const db = pgp(cn);

// Normal export
export { db };

// Exporting the database object for shared use:
export default db;


