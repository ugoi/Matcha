import { beforeEach, describe, expect, test } from "vitest";
import app from "../../app.js";
import supertest from "supertest";
import { userRepository } from "../users/users.repository.js";
import bcrypt from "bcrypt";
import { CreateUserInput, User } from "../users/users.interface.js";
import { profilesRepository } from "./profiles.repository.js";
import { up } from "../../migrations/up.js";
import { down } from "../../migrations/down.js";
import { Profile } from "./profiles.interface.js";
import TestAgent from "supertest/lib/agent.js";
import { interestsRepository } from "./interests/interests.repository.js";

async function createTestUsers(numberOfUsers: number) {
  const testUsers: { user: User; profile: Profile; password: string }[] = [];

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

    const profile = await profilesRepository.create({
      user_id: user.user_id,
      data: {
        // Using i from the outer loop that creates test users (0 to numberOfUsers-1)
        gender: i % 2 === 0 ? "male" : "female", // Even indices are male, odd are female
        age: 20 + i, // Ages will be 20, 21, 22, etc.
        sexual_preference: i % 5 === 0 ? "bisexual" : "heterosexual", // Every 5th user is bisexual
        biography: "I am a cool guy",
        profile_picture: "https://picsum.photos/200",
        gps_latitude: 40 + i, // Starting at 40°N, incrementing by 1 for each user
        gps_longitude: -70 + i, // Starting at 70°W, incrementing by 1 for each user
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

    await interestsRepository.add(
      user.user_id,
      availableInterests.slice(i * 3 % availableInterests.length, (i * 3 % availableInterests.length) + 3)
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
    await down();
    await up();
    agent = supertest.agent(app);
  });

  describe("Logged in user with his own profile", () => {
    const numberOfUsers = 10;
    let testUsers: { user: User; profile: Profile; password: string }[];

    beforeEach(async () => {
      testUsers = await createTestUsers(numberOfUsers);

      await agent
        .post("/api/login")
        .send(
          `username=${testUsers[0].user.username}&password=${testUsers[0].password}`
        )
        .set("Content-Type", "application/x-www-form-urlencoded")
        .set("Accept", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);
    });

    test("should get other profiles", async () => {
      const response = await agent.get("/api/profiles");
      expect(response.status).toBe(200);
      expect(response.body.data.profiles.length).toBe(numberOfUsers - 1);
    });

    test("should get other profiles sorted by distance", async () => {
      const response = await agent.get(
        '/api/profiles?sort_by={"distance": {"$order": "asc"}}'
      );

      let previousDistance = 0;
      response.body.data.profiles.forEach((profile: Profile) => {
        expect(profile.distance).toBeGreaterThanOrEqual(previousDistance);
        previousDistance = profile.distance;
      });
    });

    test("should get other profiles sorted by ascending age", async () => {
      const response = await agent.get(
        '/api/profiles?sort_by={"age": {"$order": "asc"}}'
      );

      let previousAge = 0;
      response.body.data.profiles.forEach((profile: Profile) => {
        expect(profile.age).toBeGreaterThanOrEqual(previousAge);
        previousAge = profile.age;
      });
    });

    test("should get other profiles sorted by descending age", async () => {
      const response = await agent.get(
        '/api/profiles?sort_by={"age": {"$order": "desc"}}'
      );

      let previousAge = 100;
      response.body.data.profiles.forEach((profile: Profile) => {
        expect(profile.age).toBeLessThanOrEqual(previousAge);
        previousAge = profile.age;
      });
    });

    test("should get other profiles sorted by distance and age", async () => {
      const response = await agent.get(
        '/api/profiles?sort_by={"distance": {"$order": "asc"}, "age": {"$order": "asc"}}'
      );

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
      const response = await agent.get(
        '/api/profiles?sort_by={"common_interests": {"$order": "asc"}}'
      );

      let previousCommonInterests = 0;
      response.body.data.profiles.forEach((profile: Profile) => {
        expect(profile.common_interests).toBeGreaterThanOrEqual(
          previousCommonInterests
        );
        previousCommonInterests = profile.common_interests;
      });
    });
  });
});
