import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedPath = path.resolve(__dirname, "../seeds/001_seed_initial.sql");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run seeds.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });

try {
  const sql = await fs.readFile(seedPath, "utf8");
  await client.connect();
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  console.log("Seed data applied successfully.");
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Failed to apply seed data.", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
