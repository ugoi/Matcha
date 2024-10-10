import lodash from "lodash";
import { accountRepository } from "../routes/user/user.repository.js";
const { unescape, escape } = lodash;

export function isHtmlTagFree(value) {
  if (!value || typeof value !== "string" || value.length === 0) {
    return true;
  }

  if (escape(value) !== value) {
    throw new Error("cannot contain html tags");
  }
  return true;
}

export async function isEmailVerified(value: string) {
  const account = await accountRepository.findOne({
    username: value,
    email: value,
  });

  if (!account) {
    throw new Error("account not found");
  }

  if (!account.is_email_verified) {
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
