// sum.test.js
import { beforeEach, expect, test, vi } from "vitest";
// use:
import { newDb } from "pg-mem";
const db = newDb();
const pg = await db.adapters.createPgPromise();

// then use it like you would with pg-promise
await pg.connect();

const sql = `
CREATE TABLE IF NOT EXISTS accounts (
user_id UUID PRIMARY KEY,
first_name TEXT,
last_name TEXT,
email TEXT UNIQUE,
phone TEXT UNIQUE, 
username TEXT UNIQUE, 
hashed_password TEXT,
is_email_verified BOOLEAN DEFAULT FALSE,
is_phone_verified BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tokens (
token_id UUID PRIMARY KEY,
user_id UUID,
token_type TEXT,
expiry_date TIMESTAMP,
used BOOLEAN DEFAULT FALSE,
value TEXT,
FOREIGN KEY (user_id) REFERENCES accounts(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS federated_credentials (
user_id UUID,
provider TEXT,
subject TEXT,
PRIMARY KEY (provider, subject),
FOREIGN KEY (user_id) REFERENCES accounts(user_id) ON DELETE CASCADE
);
`;

await pg.none(sql);

const backup = await db.backup();

beforeEach(() => {
  backup.restore();
  // you can access variables inside a factory
  vi.doMock("../../config/db-config.js", () => ({
    default: pg,
    db: pg,
  }));
});

test("finds account", async () => {
  const { db } = await import("../../config/db-config.js");
  const { accountRepository } = await import("./account.repository.js");

  await db.none(
    `INSERT INTO accounts (user_id, first_name, last_name, email, phone, username, hashed_password) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      crypto.randomUUID(),
      "test",
      "test",
      "test@gmail.com",
      "123456789",
      "test",
      "123456",
    ]
  );
  await db.one(`SELECT * FROM accounts WHERE username = 'test'`);
  const result = await accountRepository.findOne({ username: "stefan10" });
  expect(result).toBe(null);
  const result2 = await accountRepository.findOne({ username: "test" });
  expect(result2).not.toBe(null);

  const result3 = await accountRepository.findOne({ email: "test" });
  expect(result3).toBe(null);

  const result4 = await accountRepository.findOne({ email: "test@gmail.com" });
  expect(result4).not.toBe(null);

  const result5 = await accountRepository.findOne({ id: crypto.randomUUID(), email: "test@gmail.com"});
  expect(result5).not.toBe(null);

  const result6 = await accountRepository.findOne({ id: crypto.randomUUID(), email: "testnot@gmail.com"});
  expect(result6).toBe(null);

});


