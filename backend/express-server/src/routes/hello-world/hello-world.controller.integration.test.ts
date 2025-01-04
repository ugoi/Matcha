import { describe, expect, test } from "vitest";
import app from "../../app.js";
import supertest from "supertest";

describe("hello-world", () => {
  const agent = supertest.agent(app);

  test("GET /api/hello-world", async () => {
    const response = await agent.get("/api/hello-world");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello World");
  });
});
