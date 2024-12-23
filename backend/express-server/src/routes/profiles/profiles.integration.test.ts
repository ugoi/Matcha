import { beforeEach, describe, expect, test, vi } from "vitest";
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

describe("profiles", () => {
  let agent;

  beforeEach(async () => {
    agent = supertest.agent(app);

    const loginResponse = await agent
      .post("/api/login")
      .send("username=adrgonza&password=TestHola4242..")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(loginResponse.status).toBe(200);
  });

  test("GET /api/profiles", async () => {
    const response = await agent.get("/api/profiles");
    console.log(response.body.data.profiles[0]);
    expect(response.status).toBe(200);
  });
});
