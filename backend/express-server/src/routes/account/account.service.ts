import {
  CreateAccountInput,
  CreateAccountOutput,
} from "./account.interface.js";
import db from "../../db-object.js";
import bcrypt from "bcrypt";
import { JFail } from "../../error-handlers/custom-errors.js";
import { sendVerificationEmail } from "../auth/auth.service.js";
import { createToken } from "../token/token.repository.js";
import { TokenType } from "../token/token.interface.js";

export async function createAccount(
  input: CreateAccountInput
): Promise<CreateAccountOutput> {
  let hashedPassword = "";

  hashedPassword = await bcrypt.hash(input.password, 10);

  try {
    let data = await db.one(
      `
      INSERT INTO accounts(first_name, last_name, username, email, hashed_password, created_at) 
      VALUES($1, $2, $3, $4, $5, $6)
      RETURNING user_id, first_name, last_name, username, email
      `,
      [
        input.firstName,
        input.lastName,
        input.username,
        input.email,
        hashedPassword,
        new Date(),
      ]
    );

    const nextMonth = new Date();
    nextMonth.setDate(new Date().getDate() + 30);

    let tokenData = await createToken({
      user_id: data.user_id,
      token_type: TokenType.EmailVerification,
      expiry_date: nextMonth,
    });

    // On successful account creation, send verification email and return user data
    sendVerificationEmail(
      `${data.first_name} ${data.last_name}`,
      data.email,
      `http://localhost:3000/verify-email?token=${tokenData.token_id}`
    );
    return {
      status: "success",
      data: {
        user: {
          id: data.user_id,
          firstName: data.first_name,
          lastName: data.last_name,
          username: data.user_name,
          email: data.email,
        },
      },
    };
  } catch (error) {
    if (error.code == "23505") {
      throw new JFail({
        title: "The details you entered are already associated with an account",
      });
    } else {
      // rethrow error
      throw error;
    }
  }
}
