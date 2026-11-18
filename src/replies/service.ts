import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { assertCanWrite, requireViewer, type Viewer } from "@/auth/access";
import { emailSchema } from "@/auth/magic-link";
import type { Database } from "@/db";
import { LIMITS, responses, sermons } from "@/db/schema";
import { HttpError, notFound } from "@/lib/http";
import { scheduleNote } from "@/followups/service";
import { getSermonForViewer } from "@/sermons/service";
import { needsCare } from "./care";

/** Collapse runs of spaces and strip invisible control characters, keeping line breaks. */
function cleanText(value: string) {
  return value
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F​-‏‪-‮⁠-⁤]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const replySchema = z.object({
  takeaway: z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(1, "Tell us what will stick with you.")
        .max(LIMITS.takeaway, `Keep it under ${LIMITS.takeaway} characters.`),
    ),
  question: z
    .string()
    .optional()
    .transform((v) => (v ? cleanText(v) : ""))
    .pipe(z.string().max(LIMITS.question, `Keep it under ${LIMITS.question} characters.`))
    .transform((v) => v || null),
  /** Optional: the member asked for their words back on Wednesday. */
  email: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined)
    .pipe(emailSchema.optional()),
  /** Honeypot. Hidden from people; bots fill it in. */
  website: z.string().optional(),
});

export type ReplyInput = z.infer<typeof replySchema>;

export type SubmitResult = {
  saved: boolean;
  care: boolean;
  responseId: string | null;
  noteScheduled: boolean;
};

type ReplySermon = {
  id: string;
  status: "open" | "closed";
  preachedOn: string;
  churchTimezone?: string;
};

export async function submitReply(
  db: Database,
  sermon: ReplySermon,
  input: ReplyInput,
  now = new Date(),
): Promise<SubmitResult> {
  // A filled honeypot gets a normal-looking success so bots learn nothing.
  if (input.website) return { saved: false, care: false, responseId: null, noteScheduled: false };
  if (sermon.status !== "open") throw new HttpError(409, "Replies for this sermon are closed.");

  const care = needsCare(input.takeaway, input.question);
  const [row] = await db
    .insert(responses)
    .values({
      sermonId: sermon.id,
      takeaway: input.takeaway,
      question: input.question,
      careFlag: care,
    })
    .returning({ id: responses.id });
  const responseId = row!.id;

  const noteScheduled = input.email
    ? await scheduleNote(
        db,
        {
          responseId,
          email: input.email,
          preachedOn: sermon.preachedOn,
          timeZone: sermon.churchTimezone ?? "UTC",
        },
        now,
      )
    : false;

  return { saved: true, care, responseId, noteScheduled };
}

export async function listReplies(db: Database, viewer: Viewer | null, sermonId: string) {
  await getSermonForViewer(db, viewer, sermonId);
  return db
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
}

export async function setReplyHidden(
  db: Database,
  viewer: Viewer | null,
  responseId: string,
  hidden: boolean,
) {
  requireViewer(viewer);
  const [row] = await db
    .select({ churchId: sermons.churchId })
    .from(responses)
    .innerJoin(sermons, eq(sermons.id, responses.sermonId))
    .where(eq(responses.id, responseId));
  if (!row) throw notFound();
  assertCanWrite(viewer, row.churchId);

  await db.update(responses).set({ hidden }).where(eq(responses.id, responseId));
}

export const careFollowUpSchema = z.object({
  handled: z.boolean(),
  note: z
    .string()
    .trim()
    .max(200, "Keep the note under 200 characters.")
    .optional()
    .transform((v) => v || null),
});

/**
 * Someone on the church team marks that a reply that may need care was followed up,
 * for example by naming care from the front or by the care team praying. Undo clears it.
 */
export async function setCareFollowUp(
  db: Database,
  viewer: Viewer | null,
  responseId: string,
  input: z.output<typeof careFollowUpSchema>,
) {
  requireViewer(viewer);
  const [row] = await db
    .select({ churchId: sermons.churchId })
    .from(responses)
    .innerJoin(sermons, eq(sermons.id, responses.sermonId))
    .where(eq(responses.id, responseId));
  if (!row) throw notFound();
  assertCanWrite(viewer, row.churchId);

  await db
    .update(responses)
    .set(
      input.handled
        ? { careHandledAt: new Date(), careHandledBy: viewer.user.id, careNote: input.note }
        : { careHandledAt: null, careHandledBy: null, careNote: null },
    )
    .where(eq(responses.id, responseId));
}

/**
 * A recent reply to show in the Wednesday email preview. The caller must already have
 * checked that the viewer can read this sermon. Care replies are never used as the sample.
 */
export async function sampleReplyText(db: Database, sermonId: string): Promise<string | null> {
  const [row] = await db
    .select({ takeaway: responses.takeaway })
    .from(responses)
    .where(
      and(
        eq(responses.sermonId, sermonId),
        eq(responses.hidden, false),
        eq(responses.careFlag, false),
      ),
    )
    .orderBy(desc(responses.createdAt))
    .limit(1);
  return row?.takeaway ?? null;
}
