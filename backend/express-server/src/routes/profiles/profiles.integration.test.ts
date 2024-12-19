import { describe, expect, test, vi } from "vitest";
import app from "../../app.js";
import supertest from "supertest";

describe("hello-world", () => {
  test("GET /api/hello-world", async () => {
    const response = await supertest(app).get("/api/hello-world");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello World");
  });
});

// describe("profiles", () => {
//   test("GET /api/profiles", async () => {
//     const response = await supertest(app).get("/api/profiles");
//     expect(response.status).toBe(200);
//     expect(response.body).toEqual([]);
//   });
// });
