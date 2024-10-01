import { down } from "./down.js";

// Call the down function
try {
  await down();
} catch (error) {
  console.error("Error running migration", error);
  process.exit(1);
}

// Log end of migration
console.log("Migration complete");

// Exits the script
process.exit(0);
