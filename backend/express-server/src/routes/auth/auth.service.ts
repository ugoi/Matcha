import { RegisterInput, RegisterOutput } from "./auth.interface.js";
import db from "../../db-object.js";
import { randomBytes, pbkdf2 } from "crypto";
import bcrypt from "bcrypt";
import { JError, JFail } from "../../error-handlers/custom-errors.js";

export async function createAccount(
  input: RegisterInput
): Promise<RegisterOutput> {
  let hashedPassword = "";

  hashedPassword = await bcrypt.hash(input.password, 10);

  try {
    let data = await db.one(
      "INSERT INTO accounts(email, hashed_password, created_at) VALUES($1, $2, $3) RETURNING user_id, email, phone",
      [input.email, hashedPassword, new Date()]
    );

    return {
      status: "success",
      data: {
        user: {
          id: data.user_id,
          email: data.email,
        },
      },
    };
  } catch (error) {
    if (error.code == "23505") {
      throw new JFail({
        title:
          "The email address you entered is already associated with an account",
      });
    } else {
      // rethrow error
      throw error;
    }
  }
}
