// sum.test.js
import { describe, expect, test, vi } from "vitest";
import { escapeErrors, emailVerified, isHtmlTagFree } from "./utils.js";
import exp from "node:constants";
import { userRepository } from "../routes/users/users.repository.js";
import { User } from "../routes/users/users.interface.js";

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

    expect(() => emailVerified("test")).not.toThrowError();
    expect(
      async () => await emailVerified("unverified")
    ).rejects.toThrowError();
  });
});
