import { eq } from "drizzle-orm";
import { z } from "zod";
import { assertCanWrite, type Viewer } from "@/auth/access";
import type { Database } from "@/db";
import { sermons } from "@/db/schema";
import { HttpError } from "@/lib/http";
import type { ReflectionDrafter } from "@/reports/model";
import { getSermonForViewer } from "@/sermons/service";
import { REFLECTION_SYSTEM_PROMPT, reflectionUserMessage } from "./prompt";

export const reflectionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(10, "Write a full question.")
    .max(200, "Keep it under 200 characters."),
});

/** AI suggests a question. It's saved as a draft; nothing is sent until the pastor approves. */
export async function draftReflection(
  db: Database,
  viewer: Viewer | null,
  sermonId: string,
  getDrafter: () => ReflectionDrafter,
) {
  const sermon = await getSermonForViewer(db, viewer, sermonId);
  assertCanWrite(viewer, sermon.churchId);

  const question = await getDrafter().draft(
    REFLECTION_SYSTEM_PROMPT,
    reflectionUserMessage(sermon),
  );
  if (!question)
    throw new HttpError(502, "The AI couldn't suggest a question. Try again or write your own.");

  await db
    .update(sermons)
    .set({ reflectionQuestion: question.slice(0, 200), reflectionApprovedAt: null })
    .where(eq(sermons.id, sermonId));
  return question;
}

/** The pastor's final wording. Approving is what lets Wednesday notes go out. */
export async function approveReflection(
  db: Database,
  viewer: Viewer | null,
  sermonId: string,
  question: string,
  now = new Date(),
) {
  const sermon = await getSermonForViewer(db, viewer, sermonId);
  assertCanWrite(viewer, sermon.churchId);
  await db
    .update(sermons)
    .set({ reflectionQuestion: question, reflectionApprovedAt: now })
    .where(eq(sermons.id, sermonId));
}
