import { describe, expect, it } from "vitest";
import { groundOutput } from "./grounding";
import type { ModelOutput } from "./schema";

const idMap = new Map([
  ["r1", "id-1"],
  ["r2", "id-2"],
  ["r3", "id-3"],
  ["r4", "id-4"],
]);

const base: ModelOutput = {
  alignment: { level: "close", reason: "Most heard it." },
  summary: "People heard grace.",
  themes: [],
  drift: [],
  questions: [],
  care: [],
};

describe("groundOutput", () => {
  it("maps local IDs to real replies and counts them in code", () => {
    const { body, invalidRefs } = groundOutput(
      {
        ...base,
        themes: [
          { label: "Small", summary: "s", reply_ids: ["r4"] },
          { label: "Big", summary: "b", reply_ids: ["r1", "r2", "r2", " r3 "] },
        ],
      },
      idMap,
      [],
    );
    expect(invalidRefs).toBe(0);
    expect(body.themes.map((t) => [t.label, t.count])).toEqual([
      ["Big", 3],
      ["Small", 1],
    ]);
    expect(body.themes[0]!.replyIds).toEqual(["id-1", "id-2", "id-3"]);
  });

  it("drops invented replies and anything left empty", () => {
    const { body, invalidRefs } = groundOutput(
      {
        ...base,
        themes: [
          { label: "Real", summary: "x", reply_ids: ["r1", "r99"] },
          { label: "Invented", summary: "x", reply_ids: ["r42"] },
        ],
        drift: [{ heard: "made up", reply_ids: ["r77"] }],
        questions: [{ question: "q", small_group_prompt: "p", reply_ids: ["r2"] }],
      },
      idMap,
      [],
    );
    expect(invalidRefs).toBe(3);
    expect(body.themes.map((t) => t.label)).toEqual(["Real"]);
    expect(body.drift).toEqual([]);
    expect(body.questions).toHaveLength(1);
    expect(body.stats.droppedReferences).toBe(3);
  });

  it("always keeps care flags from the submit check, and adds the AI's", () => {
    const { body } = groundOutput(
      {
        ...base,
        care: [
          { reply_id: "r2", reason: "grief" },
          { reply_id: "r3", reason: "despair" },
          { reply_id: "r9", reason: "invented" },
        ],
      },
      idMap,
      ["id-3"],
    );
    expect(body.care.map((c) => [c.replyId, c.source])).toEqual([
      ["id-3", "submit-check"],
      ["id-2", "ai"],
    ]);
  });

  it("trims runaway text", () => {
    const { body } = groundOutput(
      { ...base, themes: [{ label: "x".repeat(500), summary: "y", reply_ids: ["r1"] }] },
      idMap,
      [],
    );
    expect(body.themes[0]!.label.length).toBeLessThanOrEqual(80);
  });
});
