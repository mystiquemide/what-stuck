import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/** Rebuild the test database from migrations once per test run. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return;

  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await client.unsafe("drop schema if exists public cascade; create schema public;");
    await client.unsafe("drop schema if exists drizzle cascade;");
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  } finally {
    await client.end();
  }
}
