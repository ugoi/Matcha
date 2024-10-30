import pgPromise from "pg-promise";
import {
  FilterBy,
  FilterItem,
  SortBy,
} from "../routes/profiles/profiles.interface.js";
import { profilesRepository } from "../routes/profiles/profiles.repository.js";
import { userRepository } from "../routes/users/users.repository.js";
import { JFail } from "../error-handlers/custom-errors.js";
import lodash from "lodash";
const { unescape, escape, pickBy } = lodash;
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
  sortMap: Object;
  filters: FilterBy;
  rawType: boolean;
  constructor(filters: FilterBy) {
    if (!filters || typeof filters !== "object") {
      throw new TypeError("Parameter 'filters' must be an object.");
    }
    const cleanedObject = pickBy(filters);
    this.filters = cleanedObject;
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

  toPostgres() {
    // let valuesList = [];
    const keys = Object.keys(this.filters);

    if (keys.length === 0) {
      throw new Error("Invalid filter");
    }

    const s = keys
      .map((k, index) => {
        const filterObject: FilterItem = this.filters[k];

        if (typeof filterObject !== "object") {
          throw new Error("Filter object must be an object");
        }

        const keys = Object.keys(filterObject);

        // Remove value key from keys
        const valueIndex = keys.indexOf("value");
        if (valueIndex > -1) {
          keys.splice(valueIndex, 1);
        }

        if (keys.length === 0) {
          throw new Error("Invalid filter");
        }
        const s = keys
          .map((k1, index1) => {
            const value = filterObject[k1];
            const val = pgp.as.value(value);

            // valuesList.push(value);
            const operator = this.filtersMap[k1];
            if (!operator) {
              throw new Error("Invalid filter");
            }

            if (k === "location") {
              let longitude = filterObject.value.longitude;
              let latitude = filterObject.value.latitude;
              let radius = value;

              // Use pg-promise for value formatting to prevent injection
              const lon = pgp.as.value(longitude);
              const lat = pgp.as.value(latitude);
              const rad = pgp.as.value(radius);

              return `location <-> ST_Point(${lon}, ${lat})::geography ${operator} ${rad}`;
            }

            return pgp.as.name(k) + ` ${operator} ${val}`;
          })
          .join(" AND ");

        if (keys.length > 1) {
          const result = `(${s})`;
          return result;
        } else {
          return s;
        }
      })
      .join(" AND ");
    return pgp.as.format(s);
  }
}

export class SortSet {
  sortMap: Object;
  sorts: SortBy;
  rawType: boolean;
  constructor(sorts: SortBy) {
    if (!sorts || typeof sorts !== "object") {
      throw new TypeError("Parameter 'sorts' must be an object.");
    }
    const cleanedObject = pickBy(sorts);
    this.sorts = cleanedObject;
    this.rawType = true; // do not escape the result from toPostgres()

    this.sortMap = {
      asc: "ASC",
      desc: "DESC",
    };
  }

  toPostgres() {
    let sqlCount = 0;

    const sort_by = this.sorts;
    if (sort_by) {
      const keys = Object.keys(sort_by);

      if (keys.length === 0) {
        throw new Error("Invalid sort order");
      }
      const s = keys
        .map((k, index) => {
          const filterObject = sort_by[k];
          if (typeof filterObject !== "object") {
            throw new Error("Filter object must be an object");
          }
          sqlCount++;
          const order: "asc" | "desc" = filterObject.$order;
          const sqlKeyword = this.sortMap[order];
          if (!sqlKeyword) {
            throw new Error("Invalid sort order");
          }

          if (k === "location") {
            let longitude = filterObject.value.longitude;
            let latitude = filterObject.value.latitude;

            return `location <-> ST_Point(${longitude}, ${latitude})::geography ${sqlKeyword}`;
          }
          return pgp.as.name(k) + ` ${sqlKeyword}`;
        })
        .join(", ");

      return pgp.as.format(s);
    } else {
      throw new Error("Invalid sort order");
    }
  }
}
