import { beforeEach, describe, expect, test, vi } from "vitest";
import app from "../../app.js";
import supertest from "supertest";
import { userRepository } from "../users/users.repository.js";
import bcrypt from "bcrypt";
import { CreateAccountInput } from "../auth/auth.interface.js";
import { CreateUserInput, User } from "../users/users.interface.js";
import { log, profile } from "console";
import { profilesRepository } from "./profiles.repository.js";
import { up } from "../../migrations/up.js";
import { down } from "../../migrations/down.js";
import { Profile } from "./profiles.interface.js";
import TestAgent from "supertest/lib/agent.js";
import { interestsRepository } from "./interests/interests.repository.js";

async function createTestUsers(numberOfUsers: number) {
  let testUsers: { user: User; profile: Profile; password: string }[] = [];

  for (let i = 0; i < numberOfUsers; i++) {
    const password = "TestHola4242..";
    const hashedPassword = await bcrypt.hash(password, 10);

    const input: CreateUserInput = {
      first_name: `Test${i}`,
      last_name: `User${i}`,
      username: `test.user${i}`,
      email: `test${i}.user${i}@gmail.com`,
      password_hash: hashedPassword,
      is_email_verified: true,
      created_at: new Date(),
    };

    const user = await userRepository.create(input);

    // Create a profile for the user

    const profile = await profilesRepository.create({
      user_id: user.user_id,
      data: {
        gender: Math.random() > 0.5 ? "male" : "female",
        age: Math.floor(Math.random() * 100),
        sexual_preference: Math.random() > 0.2 ? "heterosexual" : "bisexual",
        biography: "I am a cool guy",
        profile_picture: "https://picsum.photos/200",
        gps_latitude: Math.random() * 90,
        gps_longitude: Math.random() * 180,
      },
    });

    const availableInterests = [
      "music",
      "sports",
      "reading",
      "cooking",
      "travelling",
      "hiking",
      "swimming",
      "dancing",
      "gaming",
      "coding",
    ];

    const interests = await interestsRepository.add(
      user.user_id,
      availableInterests.sort(() => 0.5 - Math.random()).slice(0, 3)
    );

    testUsers.push({ user, profile, password });
  }

  return testUsers;
}

describe("hello-world", () => {
  const agent = supertest.agent(app);
  test("GET /api/hello-world", async () => {
    const response = await agent.get("/api/hello-world");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello World");
  });
});

describe("profiles", () => {
  let agent: TestAgent;

  beforeEach(async () => {
    // run migrations
    await down();
    await up();
    agent = supertest.agent(app);
  });

  describe("Logged in user with his own profile", () => {
    test("should get other profiles.", async () => {
      // Create a new user

      const numberOfUsers = 10;
      const testUsers = await createTestUsers(numberOfUsers);

      const testUser = testUsers[0];

      const loginResponse = await agent
        .post("/api/login")
        .send(
          `username=${testUser.user.username}&password=${testUser.password}`
        )
        .set("Content-Type", "application/x-www-form-urlencoded")
        .set("Accept", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(loginResponse.status).toBe(200);
      const response = await agent.get("/api/profiles");
      expect(response.status).toBe(200);
      expect(response.body.data.profiles.length).toBe(numberOfUsers - 1);
    });

    test("should get other profiles sorted by distance", async () => {
      // Create a new user
      const numberOfUsers = 10;

      const testUsers = await createTestUsers(numberOfUsers);

      const testUser = testUsers[0];

      const loginResponse = await agent
        .post("/api/login")
        .send(
          `username=${testUser.user.username}&password=${testUser.password}`
        )
        .set("Content-Type", "application/x-www-form-urlencoded")
        .set("Accept", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      const response = await agent.get('/api/profiles?sort_by={"distance": {"$order": "asc"}}');

      // Check if profiles are sorted by distance
      let previousDistance = 0;
      response.body.data.profiles.forEach((profile: Profile) => {
        expect(profile.distance).toBeGreaterThanOrEqual(previousDistance);
        previousDistance = profile.distance;
      });
    });

    test("should get other profiles sorted by ascending age", async () => {
      // Create a new user
      const numberOfUsers = 10;

      const testUsers = await createTestUsers(numberOfUsers);

      const testUser = testUsers[0];

      const loginResponse = await agent
        .post("/api/login")
        .send(
          `username=${testUser.user.username}&password=${testUser.password}`
        )
        .set("Content-Type", "application/x-www-form-urlencoded")
        .set("Accept", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      const response = await agent.get(
        '/api/profiles?sort_by={"age": {"$order": "asc"}}'
      );

      console.log(response.body.data.profiles);

      // Check if profiles are sorted by age
      let previousAge = 0;
      response.body.data.profiles.forEach((profile: Profile) => {
        expect(profile.age).toBeGreaterThanOrEqual(previousAge);
        previousAge = profile.age;
      });
    });

    test("should get other profiles sorted by descending age", async () => {
      // Create a new user
      const numberOfUsers = 10;

      const testUsers = await createTestUsers(numberOfUsers);

      const testUser = testUsers[0];

      const loginResponse = await agent
        .post("/api/login")
        .send(
          `username=${testUser.user.username}&password=${testUser.password}`
        )
        .set("Content-Type", "application/x-www-form-urlencoded")
        .set("Accept", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      const response = await agent.get(
        '/api/profiles?sort_by={"age": {"$order": "desc"}}'
      );

      // Check if profiles are sorted by age
      let previousAge = 100;
      response.body.data.profiles.forEach((profile: Profile) => {
        expect(profile.age).toBeLessThanOrEqual(previousAge);
        previousAge = profile.age;
      });
    });

    test("should get other profiles sorted by distance and age", async () => {
      // Create a new user
      const numberOfUsers = 10;

      const testUsers = await createTestUsers(numberOfUsers);

      const testUser = testUsers[0];

      const loginResponse = await agent
        .post("/api/login")
        .send(
          `username=${testUser.user.username}&password=${testUser.password}`
        )
        .set("Content-Type", "application/x-www-form-urlencoded")
        .set("Accept", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      const response = await agent.get(
        '/api/profiles?sort_by={"distance": {"$order": "asc"}, "age": {"$order": "asc"}}'
      );

      // Check if profiles are sorted by distance and age
      let previousDistance = 0;
      let previousAge = 0;
      response.body.data.profiles.forEach((profile: Profile) => {
        expect(profile.distance).toBeGreaterThanOrEqual(previousDistance);
        if (profile.distance === previousDistance) {
          expect(profile.age).toBeGreaterThanOrEqual(previousAge);
        }
        previousDistance = profile.distance;
        previousAge = profile.age;
      });
    });

    test("should get other profiles sorted by common interests", async () => {
      console.log("should get other profiles sorted by common interests");
      // Create a new user
      const numberOfUsers = 10;

      const testUsers = await createTestUsers(numberOfUsers);

      const testUser = testUsers[0];

      const loginResponse = await agent
        .post("/api/login")
        .send(
          `username=${testUser.user.username}&password=${testUser.password}`
        )
        .set("Content-Type", "application/x-www-form-urlencoded")
        .set("Accept", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      const response = await agent.get(
        '/api/profiles?sort_by={"common_interests": {"$order": "asc"}}'
      );

      // Check if profiles are sorted by common interests
      let previousCommonInterests = 0;
      
      response.body.data.profiles.forEach((profile: Profile) => {
        console.log("profile.common_interests");
        console.log(profile.common_interests);
        
        expect(profile.common_interests).toBeGreaterThanOrEqual(
          previousCommonInterests
        );
        previousCommonInterests = profile.common_interests;
      });
    });
  });
});
