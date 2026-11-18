import { z } from "zod";

/**
 * What the model must return. Kept flat, with every field required, to stay
 * well inside structured-output grammar limits. Replies are referenced by
 * short local IDs ("r1", "r2") that the server maps back to real rows.
 */
export const modelOutputSchema = z.object({
  alignment: z.object({
    level: z.enum(["close", "partial", "different"]),
    reason: z.string(),
  }),
  summary: z.string(),
  themes: z.array(
    z.object({
      label: z.string(),
      summary: z.string(),
      reply_ids: z.array(z.string()),
    }),
  ),
  drift: z.array(
    z.object({
      heard: z.string(),
      reply_ids: z.array(z.string()),
    }),
  ),
  questions: z.array(
    z.object({
      question: z.string(),
      small_group_prompt: z.string(),
      reply_ids: z.array(z.string()),
    }),
  ),
  care: z.array(
    z.object({
      reply_id: z.string(),
      reason: z.string(),
    }),
  ),
});

export type ModelOutput = z.infer<typeof modelOutputSchema>;

/** What we store and show. Every reference is a real reply ID; counts come from code. */
export type ReportBody = {
  alignment: { level: "close" | "partial" | "different"; reason: string };
  summary: string;
  themes: Array<{ label: string; summary: string; replyIds: string[]; count: number }>;
  drift: Array<{ heard: string; replyIds: string[]; count: number }>;
  questions: Array<{
    question: string;
    smallGroupPrompt: string;
    replyIds: string[];
    count: number;
  }>;
  care: Array<{ replyId: string; reason: string; source: "submit-check" | "ai" }>;
  stats: { replyCount: number; droppedReferences: number };
};
