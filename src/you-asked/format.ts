import { z } from "zod";

export const youAskedSchema = z.object({
  sermonTitle: z.string().trim().min(1).max(120),
  picks: z
    .array(
      z.object({
        question: z.string().trim().min(3).max(300),
        smallGroupPrompt: z.string().trim().max(300).optional(),
      }),
    )
    .min(1, "Pick at least one question.")
    .max(3, "Pick up to three questions."),
});

export type YouAskedInput = z.infer<typeof youAskedSchema>;

/**
 * Closing the loop: the questions the pastor picked, worded for the bulletin
 * or a slide, plus a small-group sheet. Plain text the pastor can edit.
 * Nothing is shared until the pastor copies it.
 */
export function formatYouAsked(input: YouAskedInput) {
  const bulletin = [
    "You asked",
    `After "${input.sermonTitle}", some of you were still wondering:`,
    "",
    ...input.picks.map((p) => `• ${p.question}`),
    "",
    "We'll talk about these on Sunday.",
  ].join("\n");

  const withPrompts = input.picks.filter((p) => p.smallGroupPrompt);
  const smallGroup = withPrompts.length
    ? [
        `Small group questions: ${input.sermonTitle}`,
        "",
        ...withPrompts.map(
          (p, i) => `${i + 1}. ${p.smallGroupPrompt}\n   (From the question: ${p.question})`,
        ),
      ].join("\n")
    : null;

  return { bulletin, smallGroup };
}
