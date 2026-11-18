/**
 * Generate real AI reports for the demo church's sermons. Needs ANTHROPIC_API_KEY.
 * The app also does this on startup once the key is set.
 *
 *   npm run db:seed-reports
 */
import { config } from "dotenv";
import { createDb } from "../src/db";
import { generateDemoReports } from "../src/demo/seed";
import { AnthropicReportModel } from "../src/reports/model-anthropic";

config({ path: ".env.local", quiet: true });

async function main() {
  const { DATABASE_URL: url, ANTHROPIC_API_KEY: key, ANTHROPIC_MODEL: modelName } = process.env;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const db = createDb(url);
  try {
    const model = new AnthropicReportModel(key, modelName || "claude-sonnet-5-5");
    console.log(await generateDemoReports(db, () => model));
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
