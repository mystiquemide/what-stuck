import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

export function createDb(url: string) {
  const client = postgres(url, { max: 10, prepare: false });
  return drizzle(client, { schema });
}

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: Database };

export function getDb(): Database {
  globalForDb.db ??= createDb(getEnv().DATABASE_URL);
  return globalForDb.db;
}

export { schema };
