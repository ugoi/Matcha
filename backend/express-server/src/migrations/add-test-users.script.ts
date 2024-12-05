import { up } from "./add-test-users.js";


// Call the up function
try {
  await up();
} catch (error) {
  console.error("Error running migration", error);
  process.exit(1);
}

// Log end of migration
console.log("Migration complete");

// Exits the script
process.exit(0);
