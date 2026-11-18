import { and, eq, gte, sql } from "drizzle-orm";
import { systemViewer } from "@/auth/access";
import type { Database } from "@/db";
import { memberships, reports, responses, sermons, users } from "@/db/schema";
import { reportReadyEmail } from "@/emails/report-ready";
import type { Mailer } from "@/lib/email";
import type { ReportModel } from "@/reports/model";
import { generateReport, MIN_REPLIES_FOR_REPORT } from "@/reports/service";

const LOOKBACK_DAYS = 8;
const MAX_PER_RUN = 20;

/**
 * Monday morning: build reports for recent sermons that have enough replies
 * and no up-to-date report, then email the church's staff a link.
 */
export async function runMondayReports(
  db: Database,
  deps: {
    mailer: Mailer;
    appUrl: string;
    getModel: () => ReportModel | Promise<ReportModel>;
  },
  now = new Date(),
) {
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000).toISOString().slice(0, 10);

  const candidates = await db
    .select({
      id: sermons.id,
      churchId: sermons.churchId,
      title: sermons.title,
      replyCount: sql<number>`count(${responses.id})::int`,
      questionCount: sql<number>`count(${responses.question})::int`,
      careCount: sql<number>`count(${responses.id}) filter (where ${responses.careFlag})::int`,
      lastReplyAt: sql<Date>`max(${responses.createdAt})`,
      lastReportAt: sql<Date | null>`(select max(${reports.createdAt}) from ${reports} where ${reports.sermonId} = ${sermons.id} and ${reports.status} = 'ready')`,
    })
    .from(sermons)
    .innerJoin(responses, and(eq(responses.sermonId, sermons.id), eq(responses.hidden, false)))
    .where(gte(sermons.preachedOn, since))
    .groupBy(sermons.id)
    .having(sql`count(${responses.id}) >= ${MIN_REPLIES_FOR_REPORT}`);

  const due = candidates
    .filter((c) => !c.lastReportAt || new Date(c.lastReportAt) < new Date(c.lastReplyAt))
    .slice(0, MAX_PER_RUN);

  const summary = { generated: 0, failed: 0, emailed: 0 };
  for (const sermon of due) {
    let result;
    try {
      result = await generateReport(db, systemViewer(sermon.churchId), sermon.id, deps.getModel);
    } catch (error) {
      // Usually the daily AI cap. Stop for today; the next run picks up where this left off.
      console.warn("[reports] Monday run stopped", error instanceof Error ? error.message : error);
      break;
    }
    if (result.status !== "ready") {
      summary.failed++;
      continue;
    }
    summary.generated++;

    const staff = await db
      .select({ email: users.email })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.churchId, sermon.churchId));

    for (const { email } of staff) {
      try {
        await deps.mailer.send(
          reportReadyEmail({
            to: email,
            sermonTitle: sermon.title,
            replyCount: sermon.replyCount,
            questionCount: sermon.questionCount,
            careCount: sermon.careCount,
            reportUrl: `${deps.appUrl}/app/sermons/${sermon.id}/report`,
          }),
        );
        summary.emailed++;
      } catch (error) {
        console.error(
          "[reports] email failed",
          sermon.id,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }
  return summary;
}
