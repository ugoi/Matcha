import lodash from "lodash";
import { userRepository } from "../routes/user/user.repository.js";
const { unescape, escape } = lodash;

export async function usernameExists(value) {
  const user = await userRepository.findOne({ username: value });
  if (user) {
    throw new Error("username already exists");
  }
  return true;
}

export async function emailExists(value) {
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
