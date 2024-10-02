import { RegisterInput, RegisterOutput } from "./auth.interface.js";
import db from "../../db-object.js";
import bcrypt from "bcrypt";
import { JFail } from "../../error-handlers/custom-errors.js";
import apiInstance from "../../brevo-object.js";
import brevo from "@getbrevo/brevo";
import fs from "node:fs";
import { join } from "path";
const __dirname = import.meta.dirname;

export async function createAccount(
  input: RegisterInput
): Promise<RegisterOutput> {
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

    let tokenData = await db.one(
      `
      INSERT INTO tokens(user_id, token_type, expiry_date)
      VALUES($1, $2, $3)
      RETURNING token_id
      `,
      [data.user_id, "email_verification", nextMonth]
    );

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

export async function sendVerificationEmail(
  name: string,
  email: string,
  verificationLink: string
) {
  // send email to email
  let sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = "My {{params.subject}}";
  sendSmtpEmail.htmlContent = fs.readFileSync(
    join(__dirname, "../../../public/emails/verify-email.html"),
    "utf8"
  );
  sendSmtpEmail.sender = {
    name: process.env.BREVO_SENDER_NAME,
    email: process.env.BREVO_SENDER_EMAIL,
  };
  sendSmtpEmail.to = [{ email: email, name: name }];
  sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
  sendSmtpEmail.params = {
    subject: "Verify your email - Matcha",
    verification_link: verificationLink,
  };

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    console.error(error);
  }
}

export async function verifyEmail(token: string) {
  // Check if token is valid
  let tokenData;
  try {
    tokenData = await db.one(
      `
        SELECT * FROM tokens
        WHERE token_id = $1 AND token_type = 'email_verification' AND used = false
        `,
      [token]
    );

    if (!tokenData) {
      throw new JFail({
        title: "Invalid token",
      });
    }
  } catch (error) {
    throw new JFail({
      title: "Invalid token",
    });
  }

  if (tokenData.expiry_date < new Date()) {
    throw new JFail({
      title: "Token expired",
    });
  }

  // Mark token as used
  let data = await db.one(
    `
      UPDATE tokens
      SET used = true
      WHERE token_id = $1
      RETURNING user_id
      `,
    [token]
  );

  // Mark email as verified
  await db.none(
    `
      UPDATE accounts
      SET is_email_verified = true
      WHERE user_id = $1
      `,
    [data.user_id]
  );
}
