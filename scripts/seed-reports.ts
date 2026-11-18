/**
 * Generate real AI reports for the demo church's sermons. Needs GEMINI_API_KEY or ANTHROPIC_API_KEY.
 * The app also does this on startup once the key is set.
 *
 *   npm run db:seed-reports
 */
import { config } from "dotenv";
import { createDb } from "../src/db";
import { generateDemoReports } from "../src/demo/seed";
import { createReportModel } from "../src/reports/providers";

config({ path: ".env.local", quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const model = createReportModel(process.env);
  if (!model) throw new Error("Set GEMINI_API_KEY or ANTHROPIC_API_KEY");
  const db = createDb(url);
  try {
    console.log(await generateDemoReports(db, () => model));
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
