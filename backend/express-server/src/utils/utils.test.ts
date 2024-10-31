// sum.test.js
import { describe, expect, test, vi } from "vitest";
import {
  escapeErrors,
  emailVerified,
  isHtmlTagFree,
  FilterSet,
  SortSet,
} from "./utils.js";
import exp from "node:constants";
import { userRepository } from "../routes/users/users.repository.js";
import { User } from "../routes/users/users.interface.js";
import pgPromise from "pg-promise";
import { SortOrder } from "../routes/profiles/profiles.interface.js";
const pgp = pgPromise({
  /* Initialization Options */
});

describe("utils", () => {
  test("isHtmlTagFree", () => {
    expect(() => isHtmlTagFree("<script>alert('hi')</script>")).toThrowError();
    expect(() => isHtmlTagFree("<p>hello</p>")).toThrowError();
    expect(isHtmlTagFree("hello")).toBe(true);
    expect(isHtmlTagFree("")).toBe(true);
    expect(isHtmlTagFree(null)).toBe(true);
    expect(isHtmlTagFree(undefined)).toBe(true);
    expect(isHtmlTagFree(123)).toBe(true);
    expect(isHtmlTagFree({})).toBe(true);
    expect(isHtmlTagFree([])).toBe(true);
    expect(isHtmlTagFree(true)).toBe(true);
    expect(isHtmlTagFree(false)).toBe(true);
  });

  test("escapeErrors", () => {
    const errors = [
      { type: "field", value: "<script>alert('hi')</script>" },
      { type: "field", value: "<p>hello</p>" },
      { type: "field", value: "hello" },
      { type: "field", value: "" },
      { type: "field", value: null },
      { type: "field", value: undefined },
      { type: "field", value: 123 },
      { type: "field", value: {} },
      { type: "field", value: [] },
      { type: "field", value: true },
      { type: "field", value: false },
    ];

    const escapedErrors = escapeErrors(errors);
    expect(escapedErrors).toEqual([
      {
        type: "field",
        value: "&lt;script&gt;alert(&#39;hi&#39;)&lt;/script&gt;",
      },
      { type: "field", value: "&lt;p&gt;hello&lt;/p&gt;" },
      { type: "field", value: "hello" },
      { type: "field", value: "" },
      { type: "field", value: null },
      { type: "field", value: undefined },
      { type: "field", value: 123 },
      { type: "field", value: {} },
      { type: "field", value: [] },
      { type: "field", value: true },
      { type: "field", value: false },
    ]);
  });

  test("emailVerified", async () => {
    const findOneSpy = vi
      .spyOn(userRepository, "findOne")
      .mockImplementation(async (value) => {
        if (value.username === "test" && value.email === "test") {
          const user: User = {
            user_id: "1",
            first_name: "test",
            last_name: "test",
            email: "test",
            phone: "test",
            username: "test",
            password_hash: "test",
            is_email_verified: true,
            is_phone_verified: true,
            created_at: new Date(),
          };

          return user;
        } else if (
          value.username === "unverified" &&
          value.email === "unverified"
        ) {
          const user: User = {
            user_id: "2",
            first_name: "unverified",
            last_name: "unverified",
            email: "unverified",
            phone: "unverified",
            username: "unverified",
            password_hash: "unverified",
            is_email_verified: false,
            is_phone_verified: false,
            created_at: new Date(),
          };

          return user;
        }
        return null;
      });

    if (process.env.EMAIL_VERIFICATION === "false") {
      expect(() => emailVerified("test")).not.toThrowError();
      expect(() => emailVerified("unverified")).not.toThrowError();
    } else {
      expect(() => emailVerified("test")).not.toThrowError();
      expect(
        async () => await emailVerified("unverified")
      ).rejects.toThrowError();
    }
  });

  describe("FilterSet - filtering", () => {
    test("with simple set", () => {
      var filterSet = new FilterSet({
        username: { $neq: "stefan12" },
        age: { $gte: 18 },
      });

      var where = pgp.as.format("WHERE $1", filterSet);

      console.log(where);

      expect(where).toEqual(`WHERE "username" != 'stefan12' AND "age" >= 18`);
    });

    test("with intermediate set", () => {
      var filterSet = new FilterSet({
        username: { $neq: "stefan12" },
        age: { $gte: 18, $lte: 30 },
        fame_rating: { $gt: 20, $lte: 100 },
      });

      var where = pgp.as.format("WHERE $1", filterSet);

      console.log(where);

      expect(where).toEqual(
        `WHERE "username" != 'stefan12' AND ("age" >= 18 AND "age" <= 30) AND ("fame_rating" > 20 AND "fame_rating" <= 100)`
      );
    });

    test("with wrong set", () => {
      var filterSet = new FilterSet({
        username: { $gg: "stefan12" },
        age: { $gte: 18 },
      });

      var where = () => pgp.as.format("WHERE $1", filterSet);

      expect(where).toThrowError();
    });

    test("with wrong set", () => {
      var filterSet = new FilterSet({
        username: {},
        age: { $gte: 18 },
      });

      const where = pgp.as.format("WHERE $1", filterSet);

      expect(where).toEqual(`WHERE "age" >= 18`);
    });

    test("with wrong set", () => {
      var wholeTest = () => {
        var filterSet = new FilterSet({
          username: "stefan12",
          age: { $gte: 18 },
        });

        pgp.as.format("WHERE $1", filterSet);
      };

      expect(wholeTest).toThrowError();
    });

    test("with wrong set", () => {
      var filterSet = new FilterSet({
        username: null,
        age: { $gte: 18 },
      });

      const where = pgp.as.format("WHERE $1", filterSet);

      console.log(where);

      expect(where).toEqual(`WHERE "age" >= 18`);
    });

    test("with wrong set", () => {
      var wholeTest = () => {
        var filterSet = new FilterSet({});

        pgp.as.format("WHERE $1", filterSet);
      };

      expect(wholeTest).toThrowError();
    });
  });

  describe("SortSet", () => {
    test("with simple set", () => {
      var filterSet = new SortSet({
        fame_rating: { $order: SortOrder.Asc },
        age: { $order: SortOrder.Asc },
      });

      var where = pgp.as.format("ORDER BY $1", filterSet);

      console.log(where);

      expect(where).toEqual(`ORDER BY "fame_rating" ASC, "age" ASC`);
    });

    test("with wrong set", () => {
      var wholeTest = () => {
        var filterSet = new SortSet({
          fame_rating: { $order: "lol" },
          age: { $order: SortOrder.Asc },
        });

        pgp.as.format("ORDER BY $1", filterSet);
      };

      expect(wholeTest).toThrowError();
    });

    test("with wrong set", () => {
      
      var filterSet = new SortSet({
        email: {},
        age: { $order: "asc" },
      });

      var where = pgp.as.format("ORDER BY $1", filterSet);

      expect(where).toEqual(`ORDER BY "age" ASC`);
    });

    test("with wrong set", () => {

      var wholeTest = () => {

      var filterSet = new SortSet({
        email: "asc",
        age: { $order: "asc" },
      });

      var where = pgp.as.format("ORDER BY $1", filterSet);

    }

      expect(wholeTest).toThrowError();
    });

    test("with wrong set", () => {
      var wholeTest = () => {
        var filterSet = new SortSet({});

        pgp.as.format("ORDER BY $1", filterSet);
      };

      expect(wholeTest).toThrowError();
    });
  });
});
