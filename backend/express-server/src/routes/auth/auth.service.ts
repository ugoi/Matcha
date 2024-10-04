import db from "../../db-object.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import apiInstance from "../../brevo-object.js";
import brevo from "@getbrevo/brevo";
import fs from "node:fs";
import { join } from "path";
import {
  LoginInput,
  LoginOutput,
} from "./auth.interface.js";
import { accountRepository } from "../account/account.repository.js";
import bcrypt from "bcrypt";
const __dirname = import.meta.dirname;
import jwt from "jsonwebtoken";
import { env, exitCode } from "node:process";
import { TokenType } from "../token/token.interface.js";
import { Account } from "../account/account.interface.js";

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

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  // send email to email
  let sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = "My {{params.subject}}";
  sendSmtpEmail.htmlContent = fs.readFileSync(
    join(__dirname, "../../../public/emails/reset-password.html"),
    "utf8"
  );
  sendSmtpEmail.sender = {
    name: process.env.BREVO_SENDER_NAME,
    email: process.env.BREVO_SENDER_EMAIL,
  };
  sendSmtpEmail.to = [{ email: email }];
  sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
  sendSmtpEmail.params = {
    subject: "Reset your password - Matcha",
    reset_link: resetLink,
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

export async function resetPassword(token: string, newPassword: string) {
  // Check if token is valid
  let tokenData;
  try {
    tokenData = await db.one(
      `
        SELECT * FROM tokens
        WHERE token_id = $1 AND token_type = $2 AND used = false
        `,
      [token, TokenType.PasswordReset]
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

  // Hash password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await db.none(
    `
      UPDATE accounts
      SET hashed_password = $1
      WHERE user_id = $2
      `,
    [hashedPassword, data.user_id]
  );
}

export async function login(input: LoginInput): Promise<LoginOutput> {
  // Login user
  const { username, password } = input;
  let account = await accountRepository.findOne({
    username: username,
    email: username,
  });

  if (!account) {
    throw new JFail({
      title: "Invalid credentials",
    });
  }

  if (!(await bcrypt.compare(password, account.hashed_password))) {
    throw new JFail({
      title: "Invalid credentials",
    });
  }

  var token = jwt.sign(
    {
      sub: account.user_id,
      iss: process.env.JWT_ISSUER,
      aud: process.env.JWT_AUDIENCE,
    },

    env.JWT_SECRET
  );

  return {
    status: "success",
    data: {
      token: token,
    },
  };
}

export async function loginWithGoogle(account: Account): Promise<LoginOutput> {
  if (!account) {
    throw new JFail({
      title: "Invalid credentials",
    });
  }

  var token = jwt.sign(
    {
      sub: account.user_id,
      iss: process.env.JWT_ISSUER,
      aud: process.env.JWT_AUDIENCE,
    },

    env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  return {
    status: "success",
    data: {
      token: token,
    },
  };
}
