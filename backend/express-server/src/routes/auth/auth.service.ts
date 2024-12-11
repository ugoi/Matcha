import db from "../../config/db-config.js";
import { ValidationError } from "../../error-handlers/custom-errors.js";
import apiInstance from "../../brevo-object.js";
import brevo from "@getbrevo/brevo";
import fs from "node:fs";
import { join } from "path";
import {
  CreateAccountInput,
  LoginInput,
  LoginOutput,
} from "./auth.interface.js";
import { userRepository } from "../users/users.repository.js";
import bcrypt from "bcrypt";
const __dirname = import.meta.dirname;
import jwt from "jsonwebtoken";
import { env, exitCode } from "node:process";
import { TokenType } from "../token/token.interface.js";
import { User } from "../users/users.interface.js";
import { Profile } from "passport";
import { createToken } from "../token/token.repository.js";

export async function sendVerificationEmail(
  name: string,
  email: string,
  verificationLink: string
): Promise<void> {
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

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
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

export async function verifyEmail(token: string): Promise<void> {
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

    const user = await userRepository.findOne({ id: tokenData.user_id });

    if (user.is_email_verified) {
      throw new ValidationError("Email already verified");
    }

    if (user.email !== tokenData.value) {
      throw new ValidationError("Token does not match email");
    }
  } catch (error) {
    throw new ValidationError("Invalid token");
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
    throw new ValidationError("Token expired");
  }

  // Mark email as verified
  await db.none(
    `
      UPDATE users
      SET is_email_verified = true
      WHERE user_id = $1
      `,
    [tokenData.user_id]
  );
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
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
      throw new ValidationError("Invalid token");
    }
  } catch (error) {
    throw new ValidationError("Invalid token");
  }

  if (tokenData.expiry_date < new Date()) {
    throw new ValidationError("Token expired");
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
      UPDATE users
      SET password_hash = $1
      WHERE user_id = $2
      `,
    [hashedPassword, data.user_id]
  );
}

export async function login(input: LoginInput): Promise<LoginOutput> {
  // Login user
  const { username, password } = input;
  let user = await userRepository.findOne({
    username: username,
    email: username,
  });

  if (!user) {
    throw new ValidationError("Invalid credentials");
  }

  if (!user.password_hash) {
    throw new ValidationError("Invalid credentials");
  }

  if (!(await bcrypt.compare(password, user.password_hash))) {
    throw new ValidationError("Invalid credentials");
  }

  const token = await createJwtToken(user);

  return token;
}

export async function createJwtToken(user: User): Promise<LoginOutput> {
  if (!user) {
    throw new Error("User is required");
  }

  var token = jwt.sign(
    {
      sub: user.user_id,
      iss: process.env.JWT_ISSUER,
      aud: process.env.JWT_AUDIENCE,
    },

    env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  return {
    token,
    user,
  };
}

export async function authenticatedWithFederatedProvider(
  profile: Profile
): Promise<User> {
  const issuer = profile.provider;
  let cred = await db.oneOrNone(
    "SELECT * FROM federated_credentials WHERE provider = $1 AND subject = $2",
    [issuer, profile.id]
  );
  if (!cred) {
    // The Google user has not logged in to this app before.  Create a
    // new user record and link it to the Google user.
    const { givenName, familyName } = profile.name;
    const email = profile?.emails?.[0]?.value;

    // Check if user already exists
    let userData = await userRepository.findOne({ email: email });

    if (userData) {
      if (!userData.is_email_verified) {
        // Delete the user record if the email is not verified to prevent security issues
        await db.none("DELETE FROM users WHERE user_id = $1", [
          userData.user_id,
        ]);
        // Create a new user record
        userData = await db.one(
          "INSERT INTO users (first_name, last_name, email, is_email_verified) VALUES ($1, $2, $3, $4) RETURNING *",
          [givenName, familyName, email, true]
        );
      }

      await db.none(
        "INSERT INTO federated_credentials (user_id, provider, subject) VALUES ($1, $2, $3)",
        [userData.user_id, issuer, profile.id]
      );
    } else {
      userData = await db.one(
        "INSERT INTO users (first_name, last_name, email, is_email_verified) VALUES ($1, $2, $3, $4) RETURNING *",
        [givenName, familyName, email, true]
      );
    }

    return userData;
  } else {
    // The Google user has previously logged in to the app.  Get the
    // user record linked to the Google user and log the user in.
    const user = await userRepository.findOne({ id: cred.user_id });

    return user;
  }
}

export async function authenticateWithCredentials(
  input: CreateAccountInput
): Promise<User> {
  let hashedPassword = "";

  hashedPassword = await bcrypt.hash(input.password, 10);

  // Check if user already exists
  let userData = await userRepository.findOne({
    email: input.email,
  });

  if (userData) {
    throw new ValidationError("Email already in use");
  }

  userData = await db.one(
    `
        INSERT INTO users(first_name, last_name, username, email, password_hash, created_at) 
        VALUES($1, $2, $3, $4, $5, $6)
        RETURNING *
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
  nextMonth.setDate(new Date().getDate() + Number(process.env.JWT_EXPIRES_IN));

  let tokenData = await createToken({
    user_id: userData.user_id,
    token_type: TokenType.EmailVerification,
    expiry_date: nextMonth,
    value: userData.email,
  });

  // On successful user creation, send verification email and return user data
  await sendVerificationEmail(
    `${userData.first_name} ${userData.last_name}`,
    userData.email,
    `${process.env.BASE_URL}/verify-email?token=${tokenData.token_id}`
  );

  return userData;
}
