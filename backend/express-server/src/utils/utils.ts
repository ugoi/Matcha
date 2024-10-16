import lodash from "lodash";
import { userRepository } from "../routes/user/user.repository.js";
import { profileRepository } from "../routes/profile/profile.repository.js";
import { JFail } from "../error-handlers/custom-errors.js";
const { unescape, escape } = lodash;

export async function profileNotExists(req, res, next) {
  const user_id = req.user.user_id;
  const profile = await profileRepository.findOne(user_id);
  if (profile) {
    next(new JFail("profile already exists"));
  }
  next();
}

export async function usernameNotExists(value) {
  const user = await userRepository.findOne({ username: value });
  if (user) {
    throw new Error("username already exists");
  }
  return true;
}

export async function emailNotExists(value) {
  const user = await userRepository.findOne({ email: value });
  if (user) {
    throw new Error("email already exists");
  }
  return true;
}

export function isHtmlTagFree(value) {
  if (!value || typeof value !== "string" || value.length === 0) {
    return true;
  }

  if (escape(value) !== value) {
    throw new Error("cannot contain html tags");
  }
  return true;
}

export async function emailVerified(value: string) {
  const user = await userRepository.findOne({
    username: value,
    email: value,
  });

  if (!user) {
    throw new Error("user not found");
  }

  if (!user.is_email_verified) {
    throw new Error("email not verified");
  }

  return true;
}

export function escapeErrors(errors) {
  return errors.map((error) => {
    if (
      error.type === "field" &&
      "value" in error &&
      typeof error.value === "string"
    ) {
      error.value = escape(error.value);
    }
    return error;
  });
}
