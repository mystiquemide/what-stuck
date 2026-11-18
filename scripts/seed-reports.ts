/**
 * Generate real AI reports for the demo church's closed sermons, so visitors
 * see genuine output, never hand-written stand-ins. Needs ANTHROPIC_API_KEY.
 *
 *   npm run db:seed-reports
 */
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import type { Viewer } from "../src/auth/access";
import { createDb, schema } from "../src/db";
import { DEMO_CHURCH_SLUG } from "../src/lib/demo";
import { AnthropicReportModel } from "../src/reports/model-anthropic";
import { generateReport } from "../src/reports/service";

config({ path: ".env.local", quiet: true });

async function main() {
  const { DATABASE_URL: url, ANTHROPIC_API_KEY: key, ANTHROPIC_MODEL: modelName } = process.env;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");

  const db = createDb(url);
  const model = new AnthropicReportModel(key, modelName || "claude-sonnet-5-5");

  try {
    const [church] = await db
      .select()
      .from(schema.churches)
      .where(eq(schema.churches.slug, DEMO_CHURCH_SLUG));
    if (!church) throw new Error("Seed the demo church first: npm run db:seed");

    // A system writer scoped to the demo church only, used by this script and nothing else.
    const writer = {
      kind: "staff",
      user: { id: "seed-script", email: "seed@localhost" },
      churchId: church.id,
      role: "owner",
      canWrite: true,
    } satisfies Viewer;

    const sermons = await db
      .select()
      .from(schema.sermons)
      .where(and(eq(schema.sermons.churchId, church.id)));

    for (const sermon of sermons) {
      const result = await generateReport(db, writer, sermon.id, () => model);
      console.log(`${sermon.title}: ${result.status}`);
    }
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
