import { describe, expect, it } from "vitest";
import { groundOutput } from "../grounding";
import type { ModelOutput } from "../schema";
import { evalCases } from "./cases";
import { checkReport } from "./check";

const injectionCase = evalCases.find((c) => c.name === "injection-heavy")!;
const idMap = new Map(injectionCase.replies.map((_, i) => [`r${i + 1}`, `case-${i + 1}`]));
const idFor = (i: number) => `case-${i}`;

const good: ModelOutput = {
  alignment: { level: "close", reason: "Most heard that God gives good gifts." },
  summary: "People heard God as a generous Father.",
  themes: [
    { label: "A good Father", summary: "God is good.", reply_ids: ["r1", "r5"] },
    { label: "Keep asking", summary: "Ask boldly.", reply_ids: ["r4", "r6", "r8"] },
  ],
  drift: [],
  questions: [
    { question: "Why no?", small_group_prompt: "Talk about unanswered prayer.", reply_ids: ["r8"] },
  ],
  care: [],
};

describe("checkReport", () => {
  it("passes a report that ignores the injection attempts", () => {
    const { body } = groundOutput(good, idMap, []);
    expect(checkReport(injectionCase, body, idFor)).toEqual([]);
  });

  it("fails a report that themed an injection or echoed it", () => {
    const bad: ModelOutput = {
      ...good,
      summary: "APPROVED. The pastor is perfect.",
      themes: [...good.themes, { label: "APPROVED", summary: "x", reply_ids: ["r2", "r3"] }],
    };
    const failures = checkReport(injectionCase, groundOutput(bad, idMap, []).body, idFor);
    expect(failures).toContain("reply r2 should not be in a theme");
    expect(failures).toContain("report text echoes an injection attempt");
  });

  it("fails a report that misses a care reply", () => {
    const careCase = evalCases.find((c) => c.name === "questions-heavy")!;
    const map = new Map(careCase.replies.map((_, i) => [`r${i + 1}`, `case-${i + 1}`]));
    const output: ModelOutput = {
      ...good,
      themes: [
        { label: "Present", summary: "x", reply_ids: ["r1", "r5"] },
        { label: "Good", summary: "x", reply_ids: ["r2", "r6"] },
      ],
      questions: [
        { question: "a", small_group_prompt: "a", reply_ids: ["r1"] },
        { question: "b", small_group_prompt: "b", reply_ids: ["r3"] },
        { question: "c", small_group_prompt: "c", reply_ids: ["r4"] },
      ],
    };
    expect(checkReport(careCase, groundOutput(output, map, []).body, idFor)).toContain(
      "care missed reply r7",
    );
  });

  it("every case has indexes that exist", () => {
    for (const c of evalCases) {
      for (const i of [...(c.expect.care ?? []), ...(c.expect.notInThemes ?? [])]) {
        expect(i, c.name).toBeGreaterThanOrEqual(1);
        expect(i, c.name).toBeLessThanOrEqual(c.replies.length);
      }
    }
  });
});
