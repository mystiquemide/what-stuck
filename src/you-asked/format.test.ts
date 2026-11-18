import { describe, expect, it } from "vitest";
import { formatYouAsked, youAskedSchema } from "./format";

describe("formatYouAsked", () => {
  it("builds a bulletin block and a small-group sheet", () => {
    const out = formatYouAsked(
      youAskedSchema.parse({
        sermonTitle: "Pressing On",
        picks: [
          {
            question: "How do I forgive myself?",
            smallGroupPrompt: "Share a time grace surprised you.",
          },
          { question: "Does letting go mean pretending?" },
        ],
      }),
    );
    expect(out.bulletin).toContain('After "Pressing On"');
    expect(out.bulletin).toContain("• How do I forgive myself?");
    expect(out.bulletin).toContain("• Does letting go mean pretending?");
    expect(out.smallGroup).toContain("1. Share a time grace surprised you.");
    expect(out.smallGroup).not.toContain("pretending");
  });

  it("allows one to three picks", () => {
    const base = { sermonTitle: "T", picks: [] as Array<{ question: string }> };
    expect(() => youAskedSchema.parse(base)).toThrow();
    expect(() =>
      youAskedSchema.parse({
        ...base,
        picks: Array.from({ length: 4 }, () => ({ question: "Why?" })),
      }),
    ).toThrow();
  });

  it("skips the sheet when no prompts were picked", () => {
    expect(
      formatYouAsked({ sermonTitle: "T", picks: [{ question: "Why though?" }] }).smallGroup,
    ).toBeNull();
  });
});
