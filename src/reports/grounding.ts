import type { ModelOutput, ReportBody } from "./schema";

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text.trim();

/**
 * Turn model output into a report we can trust:
 * - every reference must be a reply that was actually sent, or it's dropped
 * - items left with no real replies are dropped
 * - counts come from the references, never from the model's prose
 * - care flags from the submit-time check are always kept
 */
export function groundOutput(
  output: ModelOutput,
  idMap: ReadonlyMap<string, string>,
  submitCareIds: readonly string[],
): { body: ReportBody; invalidRefs: number } {
  let invalidRefs = 0;

  const resolve = (localIds: string[]) => {
    const real = new Set<string>();
    for (const localId of localIds) {
      const id = idMap.get(localId.trim());
      if (id) real.add(id);
      else invalidRefs++;
    }
    return [...real];
  };

  const themes = output.themes
    .map((t) => ({
      label: clip(t.label, 80),
      summary: clip(t.summary, 400),
      replyIds: resolve(t.reply_ids),
    }))
    .filter((t) => t.replyIds.length > 0)
    .map((t) => ({ ...t, count: t.replyIds.length }))
    .sort((a, b) => b.count - a.count);

  const drift = output.drift
    .map((d) => ({ heard: clip(d.heard, 400), replyIds: resolve(d.reply_ids) }))
    .filter((d) => d.replyIds.length > 0)
    .map((d) => ({ ...d, count: d.replyIds.length }));

  const questions = output.questions
    .map((q) => ({
      question: clip(q.question, 300),
      smallGroupPrompt: clip(q.small_group_prompt, 300),
      replyIds: resolve(q.reply_ids),
    }))
    .filter((q) => q.replyIds.length > 0)
    .map((q) => ({ ...q, count: q.replyIds.length }));

  const care = new Map<string, ReportBody["care"][number]>();
  for (const id of submitCareIds) {
    care.set(id, {
      replyId: id,
      reason: "Matched words that can signal distress.",
      source: "submit-check",
    });
  }
  for (const c of output.care) {
    const [id] = resolve([c.reply_id]);
    if (id && !care.has(id))
      care.set(id, { replyId: id, reason: clip(c.reason, 200), source: "ai" });
  }

  return {
    invalidRefs,
    body: {
      alignment: { level: output.alignment.level, reason: clip(output.alignment.reason, 500) },
      summary: clip(output.summary, 600),
      themes,
      drift,
      questions,
      care: [...care.values()],
      stats: { replyCount: idMap.size, droppedReferences: invalidRefs },
    },
  };
}
