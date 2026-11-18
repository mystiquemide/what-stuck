import { afterAll, describe, expect, it } from "vitest";
import { createLoginToken, redeemLoginToken } from "@/auth/magic-link";
import { staffViewer, type Viewer } from "@/auth/access";
import { HttpError } from "@/lib/http";
import { getSermonForViewer, createSermon } from "@/sermons/service";
import { createSermonSchema } from "@/sermons/schemas";
import { hasTestDb, makeStaff, testDb } from "../../test/db";
import { addTeamMember, listTeam, removeTeamMember } from "./service";
import { randomUUID } from "node:crypto";

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error instanceof HttpError ? error.status : -1;
  }
  return undefined;
}

describe.skipIf(!hasTestDb)("team", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  it("lets a pastor add a deacon, who then sees the church's sermons after signing in", async () => {
    const pastor = await makeStaff(db);
    const sermon = await createSermon(
      db,
      pastor.viewer,
      createSermonSchema.parse({
        title: "T",
        preachedOn: "2026-11-15",
        intendedTakeaway: "Grace.",
      }),
    );
    const deaconEmail = `deacon-${randomUUID()}@example.com`;
    await addTeamMember(db, pastor.viewer, deaconEmail);

    const signedIn = await redeemLoginToken(db, await createLoginToken(db, deaconEmail));
    const deacon = await staffViewer(db, signedIn!.user);
    expect(deacon?.churchId).toBe(pastor.church.id);
    expect(deacon?.kind === "staff" && deacon.role).toBe("editor");
    expect((await getSermonForViewer(db, deacon, sermon.id)).id).toBe(sermon.id);
    expect((await listTeam(db, pastor.viewer)).map((m) => m.role)).toEqual(["owner", "editor"]);
  });

  it("only lets the pastor change the team", async () => {
    const pastor = await makeStaff(db);
    const email = `d-${randomUUID()}@example.com`;
    await addTeamMember(db, pastor.viewer, email);
    const deacon = await staffViewer(
      db,
      (await redeemLoginToken(db, await createLoginToken(db, email)))!.user,
    );
    expect(await statusOf(addTeamMember(db, deacon, `x-${randomUUID()}@example.com`))).toBe(403);
    expect(await statusOf(removeTeamMember(db, deacon, pastor.user.id))).toBe(403);
    const demo: Viewer = { kind: "demo", churchId: pastor.church.id, canWrite: false };
    expect(await statusOf(addTeamMember(db, demo, `y-${randomUUID()}@example.com`))).toBe(403);
  });

  it("won't add someone twice, or someone from another church", async () => {
    const a = await makeStaff(db);
    const b = await makeStaff(db);
    const email = `dup-${randomUUID()}@example.com`;
    await addTeamMember(db, a.viewer, email);
    expect(await statusOf(addTeamMember(db, a.viewer, email))).toBe(409);
    expect(await statusOf(addTeamMember(db, b.viewer, email))).toBe(409);
    expect(await statusOf(addTeamMember(db, a.viewer, b.user.email))).toBe(409);
  });

  it("removes a member, but never the pastor themself", async () => {
    const pastor = await makeStaff(db);
    const added = await addTeamMember(db, pastor.viewer, `r-${randomUUID()}@example.com`);
    await removeTeamMember(db, pastor.viewer, added.userId);
    expect(await listTeam(db, pastor.viewer)).toHaveLength(1);
    expect(await statusOf(removeTeamMember(db, pastor.viewer, pastor.user.id))).toBe(400);
  });
});
