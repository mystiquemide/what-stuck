/** Rebuild the demo church from scratch: npm run db:seed */
import { config } from "dotenv";
import { createDb } from "../src/db";
import { seedDemo } from "../src/demo/seed";
import { demoChurch, demoSermons } from "../src/demo/seed-data";

config({ path: ".env.local", quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const db = createDb(url);
  try {
    await seedDemo(db, { replace: true });
    const total = demoSermons.reduce((n, s) => n + s.replies.length, 0);
    console.log(`Seeded ${demoChurch.name}: ${demoSermons.length} sermons, ${total} replies.`);
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
