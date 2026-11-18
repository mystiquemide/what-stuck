import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { generatePublicCode } from "../src/lib/codes";
import { demoChurch, demoSeriesTitle, demoSermons } from "./seed-data";

config({ path: ".env.local", quiet: true });

/** Most recent Sunday (today if it is Sunday), as YYYY-MM-DD, minus `weeksAgo` weeks. */
function sundayIso(weeksAgo: number, now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() - weeksAgo * 7);
  return d.toISOString().slice(0, 10);
}

/** A time just after a late-morning service in US Central time, so replies look realistic. */
function afterService(isoDate: string, index: number): Date {
  return new Date(`${isoDate}T17:${String(index % 60).padStart(2, "0")}:00Z`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    await db.transaction(async (tx) => {
      // Idempotent: replace the demo church and everything under it.
      await tx.delete(schema.churches).where(eq(schema.churches.slug, demoChurch.slug));

      const [church] = await tx
        .insert(schema.churches)
        .values({ ...demoChurch, isDemo: true })
        .returning();
      if (!church) throw new Error("Failed to create demo church");

      const [series] = await tx
        .insert(schema.series)
        .values({ churchId: church.id, title: demoSeriesTitle })
        .returning();
      if (!series) throw new Error("Failed to create demo series");

      for (const sermon of demoSermons) {
        const preachedOn = sundayIso(sermon.weeksAgo);
        const [row] = await tx
          .insert(schema.sermons)
          .values({
            churchId: church.id,
            seriesId: series.id,
            title: sermon.title,
            preachedOn,
            scriptureRef: sermon.scriptureRef,
            intendedTakeaway: sermon.intendedTakeaway,
            reflectionQuestion: sermon.reflectionQuestion ?? null,
            reflectionApprovedAt: sermon.reflectionQuestion ? new Date() : null,
            publicCode: generatePublicCode(),
            status: sermon.weeksAgo === 0 ? "open" : "closed",
          })
          .returning();
        if (!row) throw new Error(`Failed to create sermon ${sermon.title}`);

        await tx.insert(schema.responses).values(
          sermon.replies.map((reply, i) => ({
            sermonId: row.id,
            takeaway: reply.takeaway,
            question: reply.question ?? null,
            careFlag: reply.care ?? false,
            createdAt: afterService(preachedOn, i),
          })),
        );
      }
    });

    const total = demoSermons.reduce((n, s) => n + s.replies.length, 0);
    console.log(`Seeded ${demoChurch.name}: ${demoSermons.length} sermons, ${total} replies.`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
