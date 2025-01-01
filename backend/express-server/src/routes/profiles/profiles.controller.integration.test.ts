import { beforeEach, describe, expect, test, vi } from "vitest";
import app from "../../app.js";
import supertest from "supertest";
import { userRepository } from "../users/users.repository.js";
import bcrypt from "bcrypt";
import { CreateAccountInput } from "../auth/auth.interface.js";
import { CreateUserInput } from "../users/users.interface.js";
import { profile } from "console";
import { profilesRepository } from "./profiles.repository.js";
import { up } from "../../migrations/up.js";
import { down } from "../../migrations/down.js";


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
    // run migrations
    await down();
    await up();
    agent = supertest.agent(app);
  });

  test("Logged in user with his own profile, should be able to get other profiles.", async () => {
    // Create a new user

    const password = "TestHola4242..";
    const hashedPassword = await bcrypt.hash(password, 10);

    const input: CreateUserInput = {
      first_name: "Test",
      last_name: "User",
      username: "test.user",
      email: "test.user@gmail.com",
      password_hash: hashedPassword,
      is_email_verified: true,
      created_at: new Date(),
    };

    const user = await userRepository.create(input);

    // Create a profile for the user

    const profile = await profilesRepository.create({
      user_id: user.user_id,
      data: {
        gender: "male",
        age: 25,
        sexual_preference: "heterosexual",
        biography: "I am a cool guy",
        profile_picture: "https://www.google.com",
        gps_latitude: 0,
        gps_longitude: 0,
      },
    });

    const loginResponse = await agent
      .post("/api/login")
      .send(`username=${user.username}&password=${password}`)
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(loginResponse.status).toBe(200);
    const response = await agent.get("/api/profiles");
    expect(response.status).toBe(200);
  });
});
