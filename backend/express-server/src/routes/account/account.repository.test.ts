// sum.test.js
import { expect, test } from "vitest";
import { sum } from "../auth/sum.js";
import { accountRepository } from "./account.repository.js";

test("adds 1 + 2 to equal 3", async () => {
  try {
    const data = await accountRepository.findOne({
      id: "00689931-c6db-46a0-ae35-158db9c81304",
    });
  } catch (error) {
    console.log(error);
  }
  expect(sum(1, 2)).toBe(3);
});
