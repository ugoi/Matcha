import { beforeEach, describe, expect, test, vi } from "vitest";
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

// Increase test timeout to 30 seconds
vi.setConfig({ testTimeout: 30000 });

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
      availableInterests.slice(
        (i * 3) % availableInterests.length,
        ((i * 3) % availableInterests.length) + 3
      )
    );

    testUsers.push({ user, profile, password });
  }

  return testUsers;
}

describe("profiles", () => {
  let agent: TestAgent;

  beforeEach(async () => {
    await down();
    // Add small delay to ensure cleanup is complete
    await new Promise((resolve) => setTimeout(resolve, 100));
    await up();
    agent = supertest.agent(app);
  });

  describe("GET /api/profiles", () => {
    const numberOfUsers = 25;
    let testUsers: { user: User; profile: Profile; password: string }[];

    beforeEach(async () => {
      // Add delay before creating test users
      await new Promise((resolve) => setTimeout(resolve, 100));
      testUsers = await createTestUsers(numberOfUsers);

      // Add delay before login
      await new Promise((resolve) => setTimeout(resolve, 100));
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

    describe("Basic profile listing", () => {
      test("should return profiles excluding the logged-in user", async () => {
        const response = await agent.get("/api/profiles");
        expect(response.status).toBe(200);
        // Verify logged in user is not included in the results
        expect(
          response.body.data.profiles.some(
            (profile) => profile.user_id === testUsers[0].user.user_id
          )
        ).toBe(false);
      });
    });

    describe("Pagination", () => {
      test("should limit results to default of 20 profiles when no limit is specified", async () => {
        const response = await agent.get("/api/profiles");
        expect(response.status).toBe(200);
        expect(response.body.data.profiles.length).toBe(20);
      });

      test("should respect custom limit when specified within valid range", async () => {
        const limit = 5;
        const response = await agent.get(`/api/profiles?limit=${limit}`);
        expect(response.status).toBe(200);
        expect(response.body.data.profiles.length).toBe(limit);
      });

      describe("Invalid limit validation", () => {
        test("should reject limit below minimum (1)", async () => {
          const response = await agent.get("/api/profiles?limit=0");
          expect(response.body.status).toBe("fail");
        });

        test("should reject limit above maximum (100)", async () => {
          const response = await agent.get("/api/profiles?limit=101");
          expect(response.body.status).toBe("fail");
        });

        test("should reject non-numeric limit values", async () => {
          const response = await agent.get("/api/profiles?limit=abc");
          expect(response.body.status).toBe("fail");
        });
      });
    });

    describe("Sorting", () => {
      describe("Single field sorting", () => {
        test("should sort profiles by ascending distance", async () => {
          const response = await agent.get(
            '/api/profiles?sort_by={"distance": {"$order": "asc"}}'
          );

          let previousDistance = 0;
          response.body.data.profiles.forEach((profile: Profile) => {
            expect(profile.distance).toBeGreaterThanOrEqual(previousDistance);
            previousDistance = profile.distance;
          });
        });

        test("should sort profiles by ascending age", async () => {
          const response = await agent.get(
            '/api/profiles?sort_by={"age": {"$order": "asc"}}'
          );

          let previousAge = 0;
          response.body.data.profiles.forEach((profile: Profile) => {
            expect(profile.age).toBeGreaterThanOrEqual(previousAge);
            previousAge = profile.age;
          });
        });

        test("should sort profiles by descending age", async () => {
          const response = await agent.get(
            '/api/profiles?sort_by={"age": {"$order": "desc"}}'
          );

          let previousAge = 100;
          response.body.data.profiles.forEach((profile: Profile) => {
            expect(profile.age).toBeLessThanOrEqual(previousAge);
            previousAge = profile.age;
          });
        });

        test("should sort profiles by ascending common interests", async () => {
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

      describe("Multi-field sorting", () => {
        test("should sort profiles by distance and then age in ascending order", async () => {
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
      });
    });

    describe("Filtering", () => {
      describe("Single field filtering", () => {
        test("should filter profiles by gender", async () => {
          const response = await agent.get(
            '/api/profiles?filter_by={"gender": {"$eq": "female"}}'
          );

          expect(response.status).toBe(200);
          response.body.data.profiles.forEach((profile: Profile) => {
            expect(profile.gender).toBe("female");
          });
        });

        test("should filter profiles by age range", async () => {
          const minAge = 25;
          const maxAge = 30;
          const response = await agent.get(
            `/api/profiles?filter_by={"age": {"$gte": ${minAge}, "$lte": ${maxAge}}}`
          );

          expect(response.status).toBe(200);
          response.body.data.profiles.forEach((profile: Profile) => {
            expect(profile.age).toBeGreaterThanOrEqual(minAge);
            expect(profile.age).toBeLessThanOrEqual(maxAge);
          });
        });

        test("should filter profiles by sexual preference", async () => {
          const response = await agent.get(
            '/api/profiles?filter_by={"sexual_preference": {"$eq": "bisexual"}}'
          );

          expect(response.status).toBe(200);
          response.body.data.profiles.forEach((profile: Profile) => {
            expect(profile.sexual_preference).toBe("bisexual");
          });
        });

        test("should filter profiles by maximum distance", async () => {
          const maxDistance = 5;
          const response = await agent.get(
            `/api/profiles?filter_by={"distance": {"$lt": ${maxDistance}}}`
          );

          expect(response.status).toBe(200);
          response.body.data.profiles.forEach((profile: Profile) => {
            expect(profile.distance).toBeLessThan(maxDistance);
          });
        });

        test("should filter profiles by minimum common interests", async () => {
          const minCommonInterests = 2;
          const response = await agent.get(
            `/api/profiles?filter_by={"common_interests": {"$gte": ${minCommonInterests}}}`
          );

          expect(response.status).toBe(200);
          response.body.data.profiles.forEach((profile: Profile) => {
            expect(profile.common_interests).toBeGreaterThanOrEqual(
              minCommonInterests
            );
          });
        });
      });

      describe("Multi-field filtering", () => {
        test("should filter profiles by age range and gender", async () => {
          const minAge = 25;
          const maxAge = 30;
          const response = await agent.get(
            `/api/profiles?filter_by={"age": {"$gte": ${minAge}, "$lte": ${maxAge}}, "gender": {"$eq": "female"}}`
          );

          expect(response.status).toBe(200);
          response.body.data.profiles.forEach((profile: Profile) => {
            expect(profile.age).toBeGreaterThanOrEqual(minAge);
            expect(profile.age).toBeLessThanOrEqual(maxAge);
            expect(profile.gender).toBe("female");
          });
        });

        test("should filter profiles by distance and common interests", async () => {
          const maxDistance = 10;
          const minCommonInterests = 2;
          const response = await agent.get(
            `/api/profiles?filter_by={"distance": {"$lt": ${maxDistance}}, "common_interests": {"$gte": ${minCommonInterests}}}`
          );

          expect(response.status).toBe(200);
          response.body.data.profiles.forEach((profile: Profile) => {
            expect(profile.distance).toBeLessThan(maxDistance);
            expect(profile.common_interests).toBeGreaterThanOrEqual(
              minCommonInterests
            );
          });
        });
      });

      describe("Invalid filter validation", () => {
        test("should reject invalid filter operator", async () => {
          const response = await agent.get(
            '/api/profiles?filter_by={"age": {"$invalid": 25}}'
          );
          expect(response.body.status).toBe("fail");
        });

        test("should reject invalid filter field", async () => {
          const response = await agent.get(
            '/api/profiles?filter_by={"invalid_field": {"$eq": "value"}}'
          );
          expect(response.body.status).toBe("fail");
        });

        test("should reject malformed JSON in filter", async () => {
          const response = await agent.get(
            "/api/profiles?filter_by={malformed_json"
          );
          expect(response.body.status).toBe("fail");
        });
      });

      describe("Combined filtering, sorting and pagination", () => {
        test("should apply filter, sort and limit together", async () => {
          const limit = 5;
          const minAge = 25;
          const response = await agent.get(
            `/api/profiles?filter_by={"age": {"$gte": ${minAge}}}&sort_by={"distance": {"$order": "asc"}}&limit=${limit}`
          );

          expect(response.status).toBe(200);
          expect(response.body.data.profiles.length).toBeLessThanOrEqual(limit);

          let previousDistance = 0;
          response.body.data.profiles.forEach((profile: Profile) => {
            expect(profile.age).toBeGreaterThanOrEqual(minAge);
            expect(profile.distance).toBeGreaterThanOrEqual(previousDistance);
            previousDistance = profile.distance;
          });
        });
      });
    });
  });
});
