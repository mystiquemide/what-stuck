import { and, asc, desc, eq } from "drizzle-orm";
import { assertCanWrite, type Viewer } from "@/auth/access";
import type { Database } from "@/db";
import { reports, responses } from "@/db/schema";
import { getSermonForViewer } from "@/sermons/service";
import { groundOutput } from "./grounding";
import type { ReportModel } from "./model";
import { buildUserMessage, PROMPT_VERSION, SYSTEM_PROMPT } from "./prompt";
import type { ReportBody } from "./schema";

/** Below this, patterns aren't real. The pastor just reads the replies. */
export const MIN_REPLIES_FOR_REPORT = 3;
const BASE_MAX_TOKENS = 4_000;

export type GenerateResult =
  | { status: "too_few"; replyCount: number }
  | { status: "ready"; reportId: string; body: ReportBody }
  | { status: "failed"; reportId: string; reason: string };

async function visibleReplies(db: Database, sermonId: string) {
  return db
    .select({
      id: responses.id,
      takeaway: responses.takeaway,
      question: responses.question,
      careFlag: responses.careFlag,
    })
    .from(responses)
    .where(and(eq(responses.sermonId, sermonId), eq(responses.hidden, false)))
    .orderBy(asc(responses.createdAt));
}

/**
 * Build the Monday report. One retry covers truncated, refused or poorly
 * grounded output; after that, references that don't match a real reply are
 * dropped rather than shown.
 */
export async function generateReport(
  db: Database,
  viewer: Viewer | null,
  sermonId: string,
  /** Called only when there are enough replies, so setup errors don't mask "too few". */
  getModel: () => ReportModel,
): Promise<GenerateResult> {
  const sermon = await getSermonForViewer(db, viewer, sermonId);
  assertCanWrite(viewer, sermon.churchId);

  const replies = await visibleReplies(db, sermonId);
  if (replies.length < MIN_REPLIES_FOR_REPORT) {
    return { status: "too_few", replyCount: replies.length };
  }

  const model = getModel();
  const idMap = new Map(replies.map((r, i) => [`r${i + 1}`, r.id]));
  const user = buildUserMessage(
    sermon,
    replies.map((r, i) => ({ id: `r${i + 1}`, takeaway: r.takeaway, question: r.question })),
  );
  const submitCareIds = replies.filter((r) => r.careFlag).map((r) => r.id);

  let failure = "The AI didn't return a usable report.";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await model.run(SYSTEM_PROMPT, user, BASE_MAX_TOKENS * attempt);

    if (result.stopReason === "refusal") {
      failure = "The AI declined to summarize these replies.";
      continue;
    }
    if (!result.output || result.stopReason === "max_tokens") {
      failure = "The AI's answer was cut off.";
      continue;
    }

    const grounded = groundOutput(result.output, idMap, submitCareIds);
    if (grounded.invalidRefs > 0 && attempt === 1) {
      failure = "The AI referenced replies that don't exist.";
      continue;
    }
    if (grounded.body.themes.length === 0) {
      failure = "The AI didn't find any themes it could support with real replies.";
      continue;
    }

    const [row] = await db
      .insert(reports)
      .values({
        sermonId,
        status: "ready",
        model: model.name,
        promptVersion: PROMPT_VERSION,
        body: grounded.body,
        responseCount: replies.length,
      })
      .returning({ id: reports.id });
    return { status: "ready", reportId: row!.id, body: grounded.body };
  }

  const [row] = await db
    .insert(reports)
    .values({
      sermonId,
      status: "failed",
      model: model.name,
      promptVersion: PROMPT_VERSION,
      responseCount: replies.length,
      error: failure,
    })
    .returning({ id: reports.id });
  return { status: "failed", reportId: row!.id, reason: failure };
}

/** The latest report plus every reply, so the page can show real quotes and the raw list. */
export async function getReport(db: Database, viewer: Viewer | null, sermonId: string) {
  const sermon = await getSermonForViewer(db, viewer, sermonId);
  const [latest] = await db
    .select()
    .from(reports)
    .where(eq(reports.sermonId, sermonId))
    .orderBy(desc(reports.createdAt))
    .limit(1);

  const replies = await db
    .select({
      id: responses.id,
      takeaway: responses.takeaway,
      question: responses.question,
      careFlag: responses.careFlag,
      hidden: responses.hidden,
      createdAt: responses.createdAt,
    })
    .from(responses)
    .where(eq(responses.sermonId, sermonId))
    .orderBy(asc(responses.createdAt));

  const visibleCount = replies.filter((r) => !r.hidden).length;
  return {
    sermon: {
      id: sermon.id,
      title: sermon.title,
      preachedOn: sermon.preachedOn,
      scriptureRef: sermon.scriptureRef,
      intendedTakeaway: sermon.intendedTakeaway,
      status: sermon.status,
    },
    report: latest
      ? {
          id: latest.id,
          status: latest.status,
          body: latest.body as ReportBody | null,
          error: latest.error,
          model: latest.model,
          promptVersion: latest.promptVersion,
          responseCount: latest.responseCount,
          createdAt: latest.createdAt,
          stale: latest.responseCount !== visibleCount,
        }
      : null,
    canGenerate: visibleCount >= MIN_REPLIES_FOR_REPORT,
    replies,
  };
}
