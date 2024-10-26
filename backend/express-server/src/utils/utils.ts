import lodash from "lodash";
import { userRepository } from "../routes/users/users.repository.js";
import { JFail } from "../error-handlers/custom-errors.js";
import { profilesRepository } from "../routes/profiles/profiles.repository.js";
const { unescape, escape } = lodash;

import pgPromise from "pg-promise";
const pgp = pgPromise({
  /* Initialization Options */
});

export async function profileNotExists(req, res, next) {
  const user_id = req.user.user_id;
  const profile = await profilesRepository.findOne(user_id);
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
  const EmailVerificationDisabled = process.env.EMAIL_VERIFICATION === "false";
  if (EmailVerificationDisabled) {
    return true;
  }

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

export class FilterSet {
  filtersMap: Object;
  filters: Object;
  rawType: boolean;
  constructor(filters: Object) {
    if (!filters || typeof filters !== "object") {
      throw new TypeError("Parameter 'filters' must be an object.");
    }
    this.filters = filters;
    this.rawType = true; // do not escape the result from toPostgres()
    this.filtersMap = {
      $eq: "=",
      $neq: "!=",
      $gt: ">",
      $gte: ">=",
      $lt: "<",
      $lte: "<=",
      $like: "LIKE",
      $ilike: "ILIKE",
      $in: "IN",
      $nin: "NOT IN",
      $contains: "@>",
      $contained: "<@",
      $overlap: "&&",
      $exists: "IS NOT NULL",
      $nexists: "IS NULL",
    };
  }

  toPostgres(/*self*/) {
    // self = this

    let valuesList = [];
    const keys = Object.keys(this.filters);
    let sqlCount = 0;
    const s = keys
      .map((k, index) => {
        const filterObject = this.filters[k];

        const keys = Object.keys(filterObject);

        if (k === "$and") {
          const s = filterObject
            .map((v2, index2) => {

              const keys = Object.keys(v2);

              const s = keys
                .map((k3, index3) => {

                  const v3 = v2[k3];
                  const keys = Object.keys(v3);

                  const s = keys.map((k4, index4) => { 

                    sqlCount++;
                    const placeholder = "$" + sqlCount;
                    const value = v3[k4];
                    valuesList.push(value);
                    const operator = this.filtersMap[k4];
                    return pgp.as.name(k3) + ` ${operator} ${placeholder}`;
                  })
                  .join(" AND ");

                  const result = `(${s})`;
                  return result;
                })
                .join(" AND ");

              const result = `(${s})`;
              return result;
            })
            .join(" AND ");
          const result = `(${s})`;
          return result;
        } else if (k === "$or") {
        } else {
          const s = keys
            .map((k1, index1) => {
              sqlCount++;
              const placeholder = "$" + sqlCount;
              const value = filterObject[k1];
              valuesList.push(value);
              const operator = this.filtersMap[k1];
              return pgp.as.name(k) + ` ${operator} ${placeholder}`;
            })
            .join(" AND ");

          const result = `(${s})`;
          return result;
        }
      })
      .join(" AND ");
    return pgp.as.format(s, valuesList);
  }
}
