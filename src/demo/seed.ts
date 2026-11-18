import { and, eq, isNull, sql } from "drizzle-orm";
import { systemViewer } from "@/auth/access";
import type { Database } from "@/db";
import { churches, reports, responses, series, sermons } from "@/db/schema";
import { generatePublicCode } from "@/lib/codes";
import { DEMO_CHURCH_SLUG } from "@/lib/demo";
import type { ReportModel } from "@/reports/model";
import { generateReport, MIN_REPLIES_FOR_REPORT } from "@/reports/service";
import { demoChurch, demoSermons, demoSeriesTitle } from "./seed-data";

/** Most recent Sunday (today if it is Sunday), as YYYY-MM-DD, minus `weeksAgo` weeks. */
function sundayIso(weeksAgo: number, now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() - weeksAgo * 7);
  return d.toISOString().slice(0, 10);
}

/** A time just after a late-morning service in US Central time, so replies look realistic. */
function afterService(isoDate: string, index: number): Date {
  return new Date(`${isoDate}T17:${String(index % 60).padStart(2, "0")}:00Z`);
}

/**
 * Build the demo church: a three-week series with made-up replies.
 * With `replace`, any existing demo church is deleted first.
 */
export async function seedDemo(db: Database, { replace = false, now = new Date() } = {}) {
  return db.transaction(async (tx) => {
    if (replace) {
      await tx.delete(churches).where(eq(churches.slug, DEMO_CHURCH_SLUG));
    } else {
      const [existing] = await tx
        .select({ id: churches.id })
        .from(churches)
        .where(eq(churches.slug, DEMO_CHURCH_SLUG));
      if (existing) {
        // Older demo churches predate the form links; fill them in without touching anything else.
        await tx
          .update(churches)
          .set({ careFormUrl: demoChurch.careFormUrl, connectFormUrl: demoChurch.connectFormUrl })
          .where(and(eq(churches.id, existing.id), isNull(churches.careFormUrl)));
        return { created: false };
      }
    }

    const [church] = await tx
      .insert(churches)
      .values({ ...demoChurch, isDemo: true })
      .returning();
    if (!church) throw new Error("Failed to create demo church");
    const [demoSeries] = await tx
      .insert(series)
      .values({ churchId: church.id, title: demoSeriesTitle })
      .returning();
    if (!demoSeries) throw new Error("Failed to create demo series");

    for (const sermon of demoSermons) {
      const preachedOn = sundayIso(sermon.weeksAgo, now);
      const [row] = await tx
        .insert(sermons)
        .values({
          churchId: church.id,
          seriesId: demoSeries.id,
          title: sermon.title,
          preachedOn,
          scriptureRef: sermon.scriptureRef,
          intendedTakeaway: sermon.intendedTakeaway,
          reflectionQuestion: sermon.reflectionQuestion ?? null,
          reflectionApprovedAt: sermon.reflectionQuestion ? now : null,
          publicCode: generatePublicCode(),
          status: sermon.weeksAgo === 0 ? "open" : "closed",
        })
        .returning();
      if (!row) throw new Error(`Failed to create sermon ${sermon.title}`);

      await tx.insert(responses).values(
        sermon.replies.map((reply, i) => ({
          sermonId: row.id,
          takeaway: reply.takeaway,
          question: reply.question ?? null,
          careFlag: reply.care ?? false,
          createdAt: afterService(preachedOn, i),
        })),
      );
    }
    return { created: true };
  });
}

/**
 * Real AI reports for demo sermons that don't have one yet, so visitors see
 * genuine output rather than hand-written examples.
 */
export async function generateDemoReports(
  db: Database,
  getModel: () => ReportModel | Promise<ReportModel>,
) {
  const missing = await db
    .select({ id: sermons.id, churchId: sermons.churchId })
    .from(sermons)
    .innerJoin(churches, eq(churches.id, sermons.churchId))
    .leftJoin(reports, and(eq(reports.sermonId, sermons.id), eq(reports.status, "ready")))
    .where(and(eq(churches.slug, DEMO_CHURCH_SLUG), isNull(reports.id)))
    .groupBy(sermons.id)
    .having(
      sql`(select count(*) from ${responses} where ${responses.sermonId} = ${sermons.id}) >= ${MIN_REPLIES_FOR_REPORT}`,
    );

  const results = [];
  for (const sermon of missing) {
    results.push(
      (await generateReport(db, systemViewer(sermon.churchId), sermon.id, getModel)).status,
    );
  }
  return results;
}
