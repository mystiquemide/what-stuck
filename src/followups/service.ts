import { and, eq, isNotNull, isNull, lt, lte } from "drizzle-orm";
import type { Database } from "@/db";
import { churches, followups, responses, sermons } from "@/db/schema";
import { wednesdayNote } from "@/emails/wednesday-note";
import { hashToken, randomToken } from "@/lib/crypto";
import type { Mailer } from "@/lib/email";
import { NOTE_WINDOW_DAYS, noteSendTime } from "@/lib/time";
import type { Passage } from "@/scripture/passage";

export const EMAIL_RETENTION_DAYS = 14;
const BATCH_SIZE = 100;
const DAY_MS = 86_400_000;

/** Schedule a member's Wednesday note. Returns false if the week has already passed. */
export async function scheduleNote(
  db: Database,
  input: { responseId: string; email: string; preachedOn: string; timeZone: string },
  now = new Date(),
): Promise<boolean> {
  const sendAfter = noteSendTime(input.preachedOn, input.timeZone, now);
  if (!sendAfter) return false;
  await db.insert(followups).values({
    responseId: input.responseId,
    email: input.email,
    sendAfter,
    // Placeholder: the real unsubscribe token is minted when the note is sent.
    unsubTokenHash: hashToken(randomToken()),
  });
  return true;
}

export type SendResult = { sent: number; failed: number; waitingForApproval: number };

/**
 * Send notes that are due. A note only goes out once the pastor has approved
 * the sermon's reflection question; until then it waits. Failed sends stay
 * queued and are retried on the next run.
 */
export async function sendDueNotes(
  db: Database,
  deps: {
    mailer: Mailer;
    appUrl: string;
    passage: (ref: string | null) => Promise<Passage | null>;
  },
  now = new Date(),
): Promise<SendResult> {
  const due = await db
    .select({
      id: followups.id,
      email: followups.email,
      takeaway: responses.takeaway,
      sermonTitle: sermons.title,
      scriptureRef: sermons.scriptureRef,
      reflectionQuestion: sermons.reflectionQuestion,
      approvedAt: sermons.reflectionApprovedAt,
      churchName: churches.name,
    })
    .from(followups)
    .innerJoin(responses, eq(responses.id, followups.responseId))
    .innerJoin(sermons, eq(sermons.id, responses.sermonId))
    .innerJoin(churches, eq(churches.id, sermons.churchId))
    .where(
      and(isNull(followups.sentAt), lte(followups.sendAfter, now), eq(responses.hidden, false)),
    )
    .limit(BATCH_SIZE);

  const result: SendResult = { sent: 0, failed: 0, waitingForApproval: 0 };
  for (const note of due) {
    if (!note.approvedAt || !note.reflectionQuestion) {
      result.waitingForApproval++;
      continue;
    }

    const token = randomToken();
    await db
      .update(followups)
      .set({ unsubTokenHash: hashToken(token) })
      .where(eq(followups.id, note.id));

    try {
      await deps.mailer.send(
        wednesdayNote({
          to: note.email,
          churchName: note.churchName,
          sermonTitle: note.sermonTitle,
          takeaway: note.takeaway,
          reflectionQuestion: note.reflectionQuestion,
          passage: await deps.passage(note.scriptureRef),
          unsubscribeUrl: `${deps.appUrl}/api/unsubscribe/${token}`,
        }),
      );
      await db.update(followups).set({ sentAt: now }).where(eq(followups.id, note.id));
      result.sent++;
    } catch (error) {
      // No address in the log.
      console.error("[notes] send failed", note.id, error instanceof Error ? error.message : error);
      result.failed++;
    }
  }
  return result;
}

/** Delete one member's email right away. Returns true if there was something to delete. */
export async function unsubscribe(db: Database, token: string): Promise<boolean> {
  const deleted = await db
    .delete(followups)
    .where(eq(followups.unsubTokenHash, hashToken(token)))
    .returning({ id: followups.id });
  return deleted.length > 0;
}

/**
 * Keep contact details only as long as needed: sent notes after 14 days,
 * and unsent ones once their week is over (for example, never approved).
 */
export async function purgeEmails(db: Database, now = new Date()) {
  const sent = await db
    .delete(followups)
    .where(
      and(
        isNotNull(followups.sentAt),
        lt(followups.sentAt, new Date(now.getTime() - EMAIL_RETENTION_DAYS * DAY_MS)),
      ),
    )
    .returning({ id: followups.id });
  const expired = await db
    .delete(followups)
    .where(
      and(
        isNull(followups.sentAt),
        lt(followups.sendAfter, new Date(now.getTime() - NOTE_WINDOW_DAYS * DAY_MS)),
      ),
    )
    .returning({ id: followups.id });
  return { sent: sent.length, expired: expired.length };
}
