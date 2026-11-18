import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { assertCanRead, requireViewer, type Viewer } from "@/auth/access";
import type { Database } from "@/db";
import { reports, responses, series, sermons } from "@/db/schema";
import { notFound } from "@/lib/http";
import type { ReportBody } from "@/reports/schema";

/**
 * A sermon series week by week: how close each week's replies got to the
 * intended point, and its top themes. Built from stored reports, no new AI call.
 */
export async function getSeriesView(db: Database, viewer: Viewer | null, seriesId: string) {
  const [row] = await db.select().from(series).where(eq(series.id, seriesId));
  requireViewer(viewer);
  if (!row) throw notFound();
  assertCanRead(viewer, row.churchId);

  const weeks = await db
    .select({
      id: sermons.id,
      title: sermons.title,
      preachedOn: sermons.preachedOn,
      intendedTakeaway: sermons.intendedTakeaway,
    })
    .from(sermons)
    .where(eq(sermons.seriesId, seriesId))
    .orderBy(asc(sermons.preachedOn));

  const ids = weeks.map((w) => w.id);
  const latest = new Map<string, ReportBody>();
  if (ids.length) {
    const rows = await db
      .select({ sermonId: reports.sermonId, body: reports.body })
      .from(reports)
      .where(and(inArray(reports.sermonId, ids), eq(reports.status, "ready")))
      .orderBy(desc(reports.createdAt));
    for (const r of rows) if (!latest.has(r.sermonId)) latest.set(r.sermonId, r.body as ReportBody);
  }

  const counts = new Map<string, number>();
  if (ids.length) {
    const replies = await db
      .select({ sermonId: responses.sermonId })
      .from(responses)
      .where(and(inArray(responses.sermonId, ids), eq(responses.hidden, false)));
    for (const r of replies) counts.set(r.sermonId, (counts.get(r.sermonId) ?? 0) + 1);
  }

  return {
    series: { id: row.id, title: row.title },
    weeks: weeks.map((w) => {
      const body = latest.get(w.id);
      return {
        ...w,
        replyCount: counts.get(w.id) ?? 0,
        alignment: body?.alignment.level ?? null,
        topThemes: body?.themes.slice(0, 3).map((t) => ({ label: t.label, count: t.count })) ?? [],
        driftCount: body?.drift.length ?? 0,
      };
    }),
  };
}
