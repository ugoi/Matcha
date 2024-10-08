import db from "../../config/db-config.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import apiInstance from "../../brevo-object.js";
import brevo from "@getbrevo/brevo";
import fs from "node:fs";
import { join } from "path";
import {
  CreateAccountInput,
  CreateAccountOutput,
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
import { Profile } from "passport";
import { createToken } from "../token/token.repository.js";

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

    const account = await accountRepository.findOne({ id: tokenData.user_id });

    if (account.is_email_verified) {
      throw new JFail({
        title: "Email already verified",
      });
    }

    if (account.email !== tokenData.value) {
      throw new JFail({
        title: "Invalid token",
        description: "Token does not match email",
      });
    }
  } catch (error) {
    throw new JFail({
      title: "Invalid token",
    });
  } finally {
    // Mark token as used
    await db.one(
      `
      UPDATE tokens
      SET used = true
      WHERE token_id = $1
      RETURNING user_id
      `,
      [token]
    );
  }

  if (tokenData.expiry_date < new Date()) {
    throw new JFail({
      title: "Token expired",
    });
  }

  // Mark email as verified
  await db.none(
    `
      UPDATE accounts
      SET is_email_verified = true
      WHERE user_id = $1
      `,
    [tokenData.user_id]
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

  if (!account.hashed_password) {
    throw new JFail({
      title: "Invalid credentials",
    });
  }

  if (!(await bcrypt.compare(password, account.hashed_password))) {
    throw new JFail({
      title: "Invalid credentials",
    });
  }

  return await createJwtToken(account);
}

export async function createJwtToken(account: Account): Promise<LoginOutput> {
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

export async function authenticatedWithFederatedProvider(
  profile: Profile
): Promise<Account> {
  const issuer = profile.provider;
  let cred = await db.oneOrNone(
    "SELECT * FROM federated_credentials WHERE provider = $1 AND subject = $2",
    [issuer, profile.id]
  );
  if (!cred) {
    // The Google account has not logged in to this app before.  Create a
    // new user record and link it to the Google account.
    const { givenName, familyName } = profile.name;
    const email = profile?.emails?.[0]?.value;

    // Check if user already exists
    let userData = await accountRepository.findOne({ email: email });

    if (userData) {
      if (!userData.is_email_verified) {
        // Delete the user record if the email is not verified to prevent security issues
        await db.none("DELETE FROM accounts WHERE user_id = $1", [
          userData.user_id,
        ]);
        // Create a new user record
        userData = await db.one(
          "INSERT INTO accounts (first_name, last_name, email, is_email_verified) VALUES ($1, $2, $3, $4) RETURNING *",
          [givenName, familyName, email, true]
        );
      }

      await db.none(
        "INSERT INTO federated_credentials (user_id, provider, subject) VALUES ($1, $2, $3)",
        [userData.user_id, issuer, profile.id]
      );
    } else {
      userData = await db.one(
        "INSERT INTO accounts (first_name, last_name, email, is_email_verified) VALUES ($1, $2, $3, $4) RETURNING *",
        [givenName, familyName, email, true]
      );
    }

    return userData;
  } else {
    // The Google account has previously logged in to the app.  Get the
    // user record linked to the Google account and log the user in.
    const user = await accountRepository.findOne({ id: cred.user_id });

    return user;
  }
}

export async function authenticateWithCredentials(
  input: CreateAccountInput
): Promise<CreateAccountOutput> {
  let hashedPassword = "";

  hashedPassword = await bcrypt.hash(input.password, 10);

  // Check if user already exists
  let userData = await accountRepository.findOne({
    email: input.email,
  });

  if (userData) {
    throw new JFail({ data: { email: "Email already in use" } });
  }

  userData = await db.one(
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
    user_id: userData.user_id,
    token_type: TokenType.EmailVerification,
    expiry_date: nextMonth,
    value: userData.email,
  });

  // On successful account creation, send verification email and return user data
  sendVerificationEmail(
    `${userData.first_name} ${userData.last_name}`,
    userData.email,
    `http://localhost:3000/verify-email?token=${tokenData.token_id}`
  );

  const title = "Account created. Verification email sent";

  return {
    status: "success",
    data: {
      user: {
        id: userData.user_id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        email: userData.email,
      },
      title: title,
    },
  };
}
