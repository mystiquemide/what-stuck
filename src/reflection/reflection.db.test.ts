import { afterAll, describe, expect, it, vi } from "vitest";
import type { Viewer } from "@/auth/access";
import { HttpError } from "@/lib/http";
import { createSermonSchema } from "@/sermons/schemas";
import { createSermon, getSermonForViewer, updateSermon } from "@/sermons/service";
import { hasTestDb, makeStaff, testDb } from "../../test/db";
import { approveReflection, draftReflection } from "./service";

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error instanceof HttpError ? error.status : -1;
  }
  return undefined;
}

describe.skipIf(!hasTestDb)("reflection question", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  async function setup() {
    const staff = await makeStaff(db);
    const sermon = await createSermon(
      db,
      staff.viewer,
      createSermonSchema.parse({
        title: "T",
        preachedOn: "2026-11-15",
        intendedTakeaway: "Grace.",
      }),
    );
    return { ...staff, sermon };
  }

  it("saves an AI draft unapproved, then approves the pastor's wording", async () => {
    const { viewer, sermon } = await setup();
    const drafter = { draft: vi.fn(async () => "Where do you need grace this week?") };
    expect(await draftReflection(db, viewer, sermon.id, () => drafter)).toBe(
      "Where do you need grace this week?",
    );
    expect((await getSermonForViewer(db, viewer, sermon.id)).reflectionApprovedAt).toBeNull();

    await approveReflection(db, viewer, sermon.id, "Where will you lean on grace this week?");
    const saved = await getSermonForViewer(db, viewer, sermon.id);
    expect(saved.reflectionQuestion).toBe("Where will you lean on grace this week?");
    expect(saved.reflectionApprovedAt).not.toBeNull();
  });

  it("drops approval when the sermon's main point changes", async () => {
    const { viewer, sermon } = await setup();
    await approveReflection(db, viewer, sermon.id, "Where will you lean on grace this week?");
    await updateSermon(db, viewer, sermon.id, { intendedTakeaway: "Something new." });
    expect((await getSermonForViewer(db, viewer, sermon.id)).reflectionApprovedAt).toBeNull();
  });

  it("checks access before calling the AI", async () => {
    const { church, sermon } = await setup();
    const getDrafter = vi.fn();
    const demo: Viewer = { kind: "demo", churchId: church.id, canWrite: false };
    expect(await statusOf(draftReflection(db, demo, sermon.id, getDrafter))).toBe(403);
    expect(await statusOf(approveReflection(db, demo, sermon.id, "Any question here?"))).toBe(403);
    expect(getDrafter).not.toHaveBeenCalled();
  });
});
