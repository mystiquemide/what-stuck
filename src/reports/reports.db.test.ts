import { afterAll, describe, expect, it } from "vitest";
import type { Viewer } from "@/auth/access";
import { HttpError } from "@/lib/http";
import { replySchema, setReplyHidden, submitReply } from "@/replies/service";
import { createSermonSchema } from "@/sermons/schemas";
import { createSermon } from "@/sermons/service";
import { hasTestDb, makeStaff, testDb } from "../../test/db";
import type { ModelResult, ReportModel } from "./model";
import type { ModelOutput } from "./schema";
import { generateReport, getReport } from "./service";

/** A stand-in model that returns scripted results, one per call. */
class ScriptedModel implements ReportModel {
  readonly name = "scripted-test-model";
  readonly calls: Array<{ user: string; maxTokens: number }> = [];
  constructor(private readonly script: ModelResult[]) {}
  async run(_system: string, user: string, maxTokens: number) {
    this.calls.push({ user, maxTokens });
    const next = this.script.shift();
    if (!next) throw new Error("ScriptedModel ran out of results");
    return next;
  }
}

const output = (overrides: Partial<ModelOutput> = {}): ModelOutput => ({
  alignment: { level: "close", reason: "Most heard it." },
  summary: "The room heard that God finishes his work.",
  themes: [{ label: "Not finished", summary: "God is still working.", reply_ids: ["r1", "r2"] }],
  drift: [],
  questions: [],
  care: [],
  ...overrides,
});

const ok = (o = output()): ModelResult => ({ output: o, stopReason: "end_turn" });

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error instanceof HttpError ? error.status : -1;
  }
  return undefined;
}

describe.skipIf(!hasTestDb)("generateReport", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  async function sermonWith(replies: string[]) {
    const staff = await makeStaff(db);
    const sermon = await createSermon(
      db,
      staff.viewer,
      createSermonSchema.parse({
        title: "Not Finished Yet",
        preachedOn: "2026-11-15",
        intendedTakeaway: "God finishes what he starts.",
      }),
    );
    const ids: string[] = [];
    for (const takeaway of replies) {
      const r = await submitReply(db, sermon, replySchema.parse({ takeaway }));
      ids.push(r.responseId!);
    }
    return { ...staff, sermon, ids };
  }

  it("skips AI below three replies", async () => {
    const { viewer, sermon } = await sermonWith(["one", "two"]);
    const model = new ScriptedModel([]);
    expect(await generateReport(db, viewer, sermon.id, () => model)).toEqual({
      status: "too_few",
      replyCount: 2,
    });
    expect(model.calls).toHaveLength(0);
  });

  it("stores a grounded report with model and prompt version", async () => {
    const { viewer, sermon, ids } = await sermonWith([
      "God isn't done",
      "Still working on me",
      "Coffee",
    ]);
    const result = await generateReport(db, viewer, sermon.id, () => new ScriptedModel([ok()]));
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.body.themes[0]).toMatchObject({ count: 2, replyIds: [ids[0], ids[1]] });

    const page = await getReport(db, viewer, sermon.id);
    expect(page.report?.model).toBe("scripted-test-model");
    expect(page.report?.promptVersion).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(page.report?.stale).toBe(false);
    expect(page.replies).toHaveLength(3);
  });

  it("retries once when the model cites replies that don't exist", async () => {
    const { viewer, sermon } = await sermonWith(["a", "b", "c"]);
    const invented = output({
      themes: [{ label: "Fake", summary: "x", reply_ids: ["r1", "r50"] }],
    });
    const model = new ScriptedModel([ok(invented), ok()]);
    const result = await generateReport(db, viewer, sermon.id, () => model);
    expect(model.calls).toHaveLength(2);
    expect(result.status === "ready" && result.body.stats.droppedReferences).toBe(0);
  });

  it("retries with more room when the answer is cut off", async () => {
    const { viewer, sermon } = await sermonWith(["a", "b", "c"]);
    const model = new ScriptedModel([{ output: null, stopReason: "max_tokens" }, ok()]);
    await generateReport(db, viewer, sermon.id, () => model);
    expect(model.calls.map((c) => c.maxTokens)).toEqual([4000, 8000]);
  });

  it("records a failure after two refusals instead of showing anything", async () => {
    const { viewer, sermon } = await sermonWith(["a", "b", "c"]);
    const refusal: ModelResult = { output: null, stopReason: "refusal" };
    const result = await generateReport(
      db,
      viewer,
      sermon.id,
      () => new ScriptedModel([refusal, refusal]),
    );
    expect(result.status).toBe("failed");
    const page = await getReport(db, viewer, sermon.id);
    expect(page.report?.status).toBe("failed");
    expect(page.report?.body).toBeNull();
  });

  it("keeps hidden replies out of the prompt", async () => {
    const { viewer, sermon, ids } = await sermonWith([
      "keep one",
      "keep two",
      "keep three",
      "SPAM LINK",
    ]);
    await setReplyHidden(db, viewer, ids[3]!, true);
    const model = new ScriptedModel([ok()]);
    await generateReport(db, viewer, sermon.id, () => model);
    expect(model.calls[0]!.user).not.toContain("SPAM LINK");
    expect(model.calls[0]!.user).toContain("keep three");
  });

  it("always includes care replies caught at submit time", async () => {
    const { viewer, sermon, ids } = await sermonWith(["a", "b", "I want to die"]);
    const result = await generateReport(db, viewer, sermon.id, () => new ScriptedModel([ok()]));
    expect(result.status === "ready" && result.body.care.map((c) => c.replyId)).toEqual([ids[2]]);
  });

  it("marks a report stale when new replies arrive", async () => {
    const { viewer, sermon } = await sermonWith(["a", "b", "c"]);
    await generateReport(db, viewer, sermon.id, () => new ScriptedModel([ok()]));
    await submitReply(db, sermon, replySchema.parse({ takeaway: "late reply" }));
    expect((await getReport(db, viewer, sermon.id)).report?.stale).toBe(true);
  });

  it("won't let the demo or another church generate", async () => {
    const { church, sermon } = await sermonWith(["a", "b", "c"]);
    const demo: Viewer = { kind: "demo", churchId: church.id, canWrite: false };
    expect(
      await statusOf(generateReport(db, demo, sermon.id, () => new ScriptedModel([ok()]))),
    ).toBe(403);
    const other = await makeStaff(db);
    expect(
      await statusOf(generateReport(db, other.viewer, sermon.id, () => new ScriptedModel([]))),
    ).toBe(404);
    expect(await statusOf(getReport(db, other.viewer, sermon.id))).toBe(404);
  });
});
