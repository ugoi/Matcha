import { describe, expect, test, vi } from "vitest";
import app from "../../app.js";
import supertest from "supertest";

describe("hello-world", () => {
  test("GET /hello-world", async () => {
    console.log("Starting test");
    console.log(app);
    // console.log(app);
    console.log("Ending test");
    
    
    // const response = await supertest(app).get("/hello-world");
    // expect(response.status).toBe(200);
    // expect(response.text).toBe("Hello, world!");
  });
});

