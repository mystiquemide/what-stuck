export const REFLECTION_SYSTEM_PROMPT = `You write one reflection question for church members to sit with in the middle of the week after a sermon.

Rules:
- One question, one sentence, under 25 words.
- Personal and open-ended. Never a yes/no question. Never a quiz about the sermon.
- Gentle. Invite honesty; don't pressure or shame.
- Stay with the pastor's intended point. Don't add new teaching or quote Scripture.
- Plain words a teenager or a grandparent would understand.`;

export function reflectionUserMessage(sermon: {
  title: string;
  scriptureRef: string | null;
  intendedTakeaway: string;
}) {
  return [
    `Sermon title: ${sermon.title}`,
    `Scripture: ${sermon.scriptureRef ?? "not given"}`,
    `The pastor's intended point: ${sermon.intendedTakeaway}`,
  ].join("\n");
}
