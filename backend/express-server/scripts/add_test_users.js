import fs from "fs";
import path from "path";
import axios from "axios";
import qs from "querystring";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for API endpoints
const BASE_URL = "http://localhost:3000";

/**
 * Creates a test user by performing a series of API calls: signup, login, upload pictures, update profile, and add interests.
 * Each user uses its own cookie jar instance to maintain session cookies.
 * @param {Object} user - test user data from the JSON file
 */
async function createUser(user) {
  // Create a cookie jar for this user and an axios instance that uses it
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, withCredentials: true }));

  try {
    console.log(`Creating user ${user.username}...`);

    // Step 1: Signup
    await client.post(
      `${BASE_URL}/api/signup`,
      qs.stringify({
        firstName: user.firstName,
        username: user.username,
        lastName: user.lastName,
        email: user.email,
        password: user.password,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    console.log(`User ${user.username} signed up successfully.`);

    // Step 2: Login
    await client.post(
      `${BASE_URL}/api/login`,
      qs.stringify({
        username: user.username,
        password: user.password,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    console.log(`User ${user.username} logged in successfully.`);

    // Step 3: Upload pictures (if provided)
    if (
      user.pictures &&
      Array.isArray(user.pictures) &&
      user.pictures.length > 0
    ) {
      await client.post(
        `${BASE_URL}/api/profiles/me/pictures`,
        qs.stringify({ pictures: user.pictures }, { arrayFormat: "repeat" }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      console.log(`User ${user.username} pictures uploaded successfully.`);
    }

    // Step 4: Update profile
    // Use provided gps coordinates or generate random ones within ~100km range of a default base (e.g. 40, -73)
    let gps_latitude = user.gps_latitude;
    let gps_longitude = user.gps_longitude;
    if (gps_latitude === undefined || gps_longitude === undefined) {
      const baseLat = 40;
      const baseLon = -73;
      // Offset roughly +/- 0.9 degrees (~100km)
      gps_latitude = baseLat + (Math.random() * 1.8 - 0.9);
      gps_longitude = baseLon + (Math.random() * 1.8 - 0.9);
    }

    await client.post(
      `${BASE_URL}/api/profiles/me`,
      qs.stringify({
        gender: user.gender || "female",
        age: user.age || 19,
        sexual_preference: user.sexual_preference || "heterosexual",
        biography: user.biography || "Hello",
        profile_picture:
          user.profile_picture ||
          (user.pictures && user.pictures[0]) ||
          "https://picsum.photos/id/19/200/200",
        gps_latitude: gps_latitude,
        gps_longitude: gps_longitude,
        age_min: user.age_min || 23,
        age_max: user.age_max || 20,
        fame_rating_min: user.fame_rating_min || 1,
        fame_rating_max: user.fame_rating_max || 100,
        location_radius: user.location_radius || 100,
        interests_filter: user.interests_filter || "biking, hiking",
        common_interests: user.common_interests || 2,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    console.log(`User ${user.username} profile updated successfully.`);

    // Step 5: Add interests
    if (
      user.interests &&
      Array.isArray(user.interests) &&
      user.interests.length > 0
    ) {
      await client.post(
        `${BASE_URL}/api/profiles/me/interests`,
        qs.stringify({ interests: user.interests }, { arrayFormat: "repeat" }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      console.log(`User ${user.username} interests added successfully.`);
    }

    console.log(`User ${user.username} created successfully!`);
  } catch (error) {
    console.error(
      `Error creating user ${user.username}:`,
      error.response ? error.response.data : error.message
    );
  }
}

// Main function: Reads test_users.json and creates all users in parallel
async function main() {
  const dataPath = path.join(__dirname, "test_users.json");
  if (!fs.existsSync(dataPath)) {
    console.error("Error: test_users.json file not found!");
    process.exit(1);
  }
  let users;
  try {
    users = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch (err) {
    console.error("Error reading test_users.json:", err);
    process.exit(1);
  }
  if (!Array.isArray(users)) {
    console.error(
      "Error: test_users.json should contain an array of user objects."
    );
    process.exit(1);
  }
  // Create all users in parallel
  await Promise.all(users.map((user) => createUser(user)));
}

main();
