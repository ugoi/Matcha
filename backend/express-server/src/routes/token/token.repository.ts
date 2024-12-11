import db from "../../config/db-config.js";

import { CreateTokenInput, Token } from "./token.interface.js";

export async function createToken(input: CreateTokenInput): Promise<Token> {
  let data = await db.one(
    `
      INSERT INTO tokens(user_id, token_type, expiry_date, value)
      VALUES($1, $2, $3, $4)
      RETURNING token_id
      `,
    [input.user_id, input.token_type, input.expiry_date, input.value]
  );

  return data;
}
