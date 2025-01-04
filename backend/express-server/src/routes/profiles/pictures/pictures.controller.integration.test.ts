import { beforeEach, describe, expect, test } from "vitest";
import app from "../../../app.js";
import supertest from "supertest";
import { userRepository } from "../../users/users.repository.js";
import bcrypt from "bcrypt";
import { CreateUserInput } from "../../users/users.interface.js";
import { up } from "../../../migrations/up.js";
import { down } from "../../../migrations/down.js";
import TestAgent from "supertest/lib/agent.js";
import path from "path";
import { readFileSync } from "fs";

describe("pictures", () => {
  let agent: TestAgent;
  let userId: string;

  beforeEach(async () => {
    await down();
    await up();
    agent = supertest.agent(app);

    // Create and login a test user
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
    userId = user.user_id;

    // Login
    const response = await agent
      .post("/api/login")
      .send(`username=${input.username}&password=${password}`)
      .set("Content-Type", "application/x-www-form-urlencoded")
      .expect(200);

    console.log(response.body);
  });

  describe("GET /api/profiles/me/pictures", () => {
    test("should return empty array when no pictures", async () => {
      const response = await agent.get("/api/profiles/me/pictures").expect(200);
      expect(response.body.data.pictures).toEqual([]);
    });
  });

  describe("POST /api/profiles/me/pictures (URL upload)", () => {
    test("should add pictures via URLs", async () => {
      const pictures = [
        "https://example.com/pic1.jpg",
        "https://example.com/pic2.jpg",
      ];

      const response = await agent
        .post("/api/profiles/me/pictures")
        .send({ pictures })
        .expect(200);

      expect(response.body.data.pictures).toHaveLength(2);
      expect(response.body.data.pictures[0].picture_url).toBe(pictures[0]);
      expect(response.body.data.pictures[1].picture_url).toBe(pictures[1]);
    });

    test("should reject more than 5 pictures", async () => {
      const pictures = Array(6).fill("https://example.com/pic.jpg");

      const response = await agent
        .post("/api/profiles/me/pictures")
        .send({ pictures });

      expect(response.body.status).toBe("fail");
    });

    test("should reject invalid URLs", async () => {
      const pictures = ["not-a-url"];

      const response = await agent
        .post("/api/profiles/me/pictures")
        .send({ pictures });

      expect(response.body.status).toBe("fail");
    });
  });

  describe("POST /api/profiles/me/pictures/upload (File upload)", () => {
    const testImagePath = path.join(
      process.cwd(),
      "test",
      "assets",
      "test-image.jpg"
    );

    test("should upload picture files", async () => {
      console.log("testImagePath");

      // add sleep
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await agent
        .post("/api/profiles/me/pictures/upload")
        .attach("pictures", readFileSync(testImagePath), "test-image.jpg")
        .expect(200);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(response.body);

      expect(response.body.data.pictures).toHaveLength(1);
      expect(response.body.data.pictures[0].picture_url).toMatch(
        /^https:\/\/.+\/pictures\/.+\.jpg$/
      );
    });

    test("should upload multiple picture files", async () => {
      const response = await agent
        .post("/api/profiles/me/pictures/upload")
        .attach("pictures", readFileSync(testImagePath), "test-image1.jpg")
        .attach("pictures", readFileSync(testImagePath), "test-image2.jpg")
        .expect(200);

      expect(response.body.data.pictures).toHaveLength(2);
      response.body.data.pictures.forEach((pic) => {
        expect(pic.picture_url).toMatch(/^https:\/\/.+\/pictures\/.+\.jpg$/);
      });
    });

    test("should reject more than 5 files", async () => {
      const requests = Array(6)
        .fill(null)
        .map(() =>
          agent
            .post("/api/profiles/me/pictures/upload")
            .attach("pictures", readFileSync(testImagePath), "test-image.jpg")
        );

      const response = await Promise.all(requests);
      expect(response[5].body.status).toBe("error");
    });

    test("should reject non-image files", async () => {
      const textFilePath = path.join(
        process.cwd(),
        "test",
        "assets",
        "test-file.txt"
      );

      const response = await agent
        .post("/api/profiles/me/pictures/upload")
        .attach("pictures", readFileSync(textFilePath), "test-file.txt");

      expect(response.body.status).toBe("error");
    });
  });

  // describe("DELETE /api/profiles/me/pictures", () => {
  //   test("should delete pictures", async () => {
  //     // First add some pictures
  //     const pictures = [
  //       "https://example.com/pic1.jpg",
  //       "https://example.com/pic2.jpg",
  //     ];

  //     await agent
  //       .post("/api/profiles/me/pictures")
  //       .send({ pictures })
  //       .expect(200);

  //     // Then delete one
  //     const response = await agent
  //       .delete("/api/profiles/me/pictures")
  //       .send({ pictures: [pictures[0]] })
  //       .expect(200);

  //     expect(response.body.data.pictures).toHaveLength(1);
  //     expect(response.body.data.pictures[0].picture_url).toBe(pictures[1]);
  //   });

  //   test("should handle deleting non-existent pictures", async () => {
  //     const response = await agent
  //       .delete("/api/profiles/me/pictures")
  //       .send({ pictures: ["https://example.com/nonexistent.jpg"] })
  //       .expect(200);

  //     expect(response.body.data.pictures).toHaveLength(0);
  //   });
  // });
});
