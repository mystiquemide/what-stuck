import { afterAll, describe, expect, it } from "vitest";
import type { Viewer } from "@/auth/access";
import { HttpError } from "@/lib/http";
import { replySchema, setReplyHidden, submitReply } from "@/replies/service";
import { hasTestDb, makeStaff, testDb } from "../../test/db";
import { createSermonSchema } from "./schemas";
import {
  createSeries,
  createSermon,
  getPublicSermon,
  getSermonForViewer,
  listSermons,
  updateSermon,
} from "./service";

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error instanceof HttpError ? error.status : -1;
  }
  return undefined;
}

const sermonInput = createSermonSchema.parse({
  title: "Not Finished Yet",
  preachedOn: "2026-11-15",
  scriptureRef: "Philippians 1:3-11",
  intendedTakeaway: "God finishes what he starts in you.",
});

describe.skipIf(!hasTestDb)("sermons", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  it("lets a pastor create a sermon with a public code", async () => {
    const { viewer } = await makeStaff(db);
    const sermon = await createSermon(db, viewer, sermonInput);
    expect(sermon.publicCode).toMatch(/^[a-z2-9]{8}$/);
    expect(sermon.status).toBe("open");
  });

  it("keeps sermons private to their church", async () => {
    const a = await makeStaff(db);
    const b = await makeStaff(db);
    const sermon = await createSermon(db, a.viewer, sermonInput);
    expect(await statusOf(getSermonForViewer(db, b.viewer, sermon.id))).toBe(404);
    expect(await statusOf(updateSermon(db, b.viewer, sermon.id, { status: "closed" }))).toBe(404);
    expect(await listSermons(db, b.viewer)).toHaveLength(0);
  });

  it("asks for sign-in when nobody is signed in", async () => {
    expect(await statusOf(listSermons(db, null))).toBe(401);
    expect(await statusOf(createSermon(db, null, sermonInput))).toBe(401);
  });

  it("refuses writes from the demo", async () => {
    const { church } = await makeStaff(db);
    const demo: Viewer = { kind: "demo", churchId: church.id, canWrite: false };
    expect(await statusOf(createSermon(db, demo, sermonInput))).toBe(403);
  });

  it("won't attach another church's series", async () => {
    const a = await makeStaff(db);
    const b = await makeStaff(db);
    const theirs = await createSeries(db, b.viewer, "Their series");
    expect(
      await statusOf(createSermon(db, a.viewer, { ...sermonInput, seriesId: theirs.id })),
    ).toBe(400);
  });

  it("clears the approved reflection question when the main point changes", async () => {
    const { viewer } = await makeStaff(db);
    const sermon = await createSermon(db, viewer, sermonInput);
    await updateSermon(db, viewer, sermon.id, { reflectionApprovedAt: new Date() } as never);
    const updated = await updateSermon(db, viewer, sermon.id, {
      intendedTakeaway: "A different point.",
    });
    expect(updated.reflectionApprovedAt).toBeNull();
  });

  it("leaves fields alone that an update doesn't mention", async () => {
    const { viewer } = await makeStaff(db);
    const sermon = await createSermon(db, viewer, sermonInput);
    const updated = await updateSermon(db, viewer, sermon.id, { status: "closed" });
    expect(updated.scriptureRef).toBe("Philippians 1:3-11");
    expect(updated.seriesId).toBeNull();
    expect(updated.title).toBe("Not Finished Yet");
  });

  it("validates the intended takeaway length", () => {
    expect(() =>
      createSermonSchema.parse({ ...sermonInput, intendedTakeaway: "x".repeat(281) }),
    ).toThrow();
    expect(() => createSermonSchema.parse({ ...sermonInput, intendedTakeaway: "   " })).toThrow();
  });
});

describe.skipIf(!hasTestDb)("replies", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  it("saves a reply and counts it", async () => {
    const { viewer } = await makeStaff(db);
    const sermon = await createSermon(db, viewer, sermonInput);
    const result = await submitReply(
      db,
      sermon,
      replySchema.parse({ takeaway: "  God isn't   finished with me.  ", question: "" }),
    );
    expect(result).toMatchObject({ saved: true, care: false });
    const [listed] = await listSermons(db, viewer);
    expect(listed?.replyCount).toBe(1);
    expect(listed?.questionCount).toBe(0);
  });

  it("flags replies that need care", async () => {
    const { viewer } = await makeStaff(db);
    const sermon = await createSermon(db, viewer, sermonInput);
    const result = await submitReply(
      db,
      sermon,
      replySchema.parse({ takeaway: "I don't see the point of anything anymore" }),
    );
    expect(result.care).toBe(true);
    expect((await getSermonForViewer(db, viewer, sermon.id)).careCount).toBe(1);
  });

  it("quietly drops bot submissions", async () => {
    const { viewer } = await makeStaff(db);
    const sermon = await createSermon(db, viewer, sermonInput);
    const result = await submitReply(
      db,
      sermon,
      replySchema.parse({ takeaway: "buy cheap watches", website: "http://spam.example" }),
    );
    expect(result.saved).toBe(false);
    expect((await getSermonForViewer(db, viewer, sermon.id)).replyCount).toBe(0);
  });

  it("refuses replies once the pastor closes them", async () => {
    const { viewer } = await makeStaff(db);
    const sermon = await createSermon(db, viewer, sermonInput);
    const closed = await updateSermon(db, viewer, sermon.id, { status: "closed" });
    expect(await statusOf(submitReply(db, closed, replySchema.parse({ takeaway: "late" })))).toBe(
      409,
    );
  });

  it("rejects empty and over-long replies", () => {
    expect(() => replySchema.parse({ takeaway: "   " })).toThrow();
    expect(() => replySchema.parse({ takeaway: "x".repeat(501) })).toThrow();
    expect(() => replySchema.parse({ takeaway: "ok", question: "y".repeat(501) })).toThrow();
  });

  it("strips invisible characters", () => {
    expect(replySchema.parse({ takeaway: "Grace​ not\u0007 grit" }).takeaway).toBe(
      "Grace not grit",
    );
  });

  it("lets staff hide a reply, which drops it from counts", async () => {
    const { viewer } = await makeStaff(db);
    const sermon = await createSermon(db, viewer, sermonInput);
    const { responseId } = await submitReply(db, sermon, replySchema.parse({ takeaway: "spam" }));
    await setReplyHidden(db, viewer, responseId!, true);
    expect((await getSermonForViewer(db, viewer, sermon.id)).replyCount).toBe(0);
  });

  it("won't let another church or the demo hide replies", async () => {
    const a = await makeStaff(db);
    const b = await makeStaff(db);
    const sermon = await createSermon(db, a.viewer, sermonInput);
    const { responseId } = await submitReply(db, sermon, replySchema.parse({ takeaway: "hi" }));
    expect(await statusOf(setReplyHidden(db, b.viewer, responseId!, true))).toBe(404);
    const demo: Viewer = { kind: "demo", churchId: a.church.id, canWrite: false };
    expect(await statusOf(setReplyHidden(db, demo, responseId!, true))).toBe(403);
  });

  it("shows only safe fields publicly", async () => {
    const { viewer } = await makeStaff(db);
    const sermon = await createSermon(db, viewer, sermonInput);
    const pub = await getPublicSermon(db, sermon.publicCode);
    expect(Object.keys(pub!).sort()).toEqual(
      [
        "churchCareContact",
        "churchCareFormUrl",
        "churchConnectFormUrl",
        "churchName",
        "churchTimezone",
        "id",
        "preachedOn",
        "scriptureRef",
        "status",
        "title",
      ].sort(),
    );
    expect(JSON.stringify(pub)).not.toContain("God finishes");
  });
});
