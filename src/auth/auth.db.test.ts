import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { schema } from "@/db";
import { DEMO_CHURCH_SLUG } from "@/lib/demo";
import { HttpError } from "@/lib/http";
import { hasTestDb, makeChurchWithSermon, testDb } from "../../test/db";
import {
  assertCanRead,
  assertCanWrite,
  createChurchForUser,
  demoViewer,
  staffViewer,
  type Viewer,
} from "./access";
import {
  createLoginToken,
  deleteSession,
  findSessionUser,
  LOGIN_TOKEN_TTL_MS,
  redeemLoginToken,
} from "./magic-link";

const email = () => `pastor-${randomUUID()}@example.com`;

function statusOf(fn: () => void): number | undefined {
  try {
    fn();
  } catch (error) {
    return error instanceof HttpError ? error.status : -1;
  }
  return undefined;
}

describe.skipIf(!hasTestDb)("magic-link sign-in", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  it("signs in once and opens a session", async () => {
    const address = email();
    const token = await createLoginToken(db, address);
    const result = await redeemLoginToken(db, token);
    expect(result?.user.email).toBe(address);
    expect((await findSessionUser(db, result!.sessionToken))?.email).toBe(address);
  });

  it("refuses to reuse a link", async () => {
    const token = await createLoginToken(db, email());
    expect(await redeemLoginToken(db, token)).not.toBeNull();
    expect(await redeemLoginToken(db, token)).toBeNull();
  });

  it("refuses an expired link", async () => {
    const issued = new Date("2026-11-01T10:00:00Z");
    const token = await createLoginToken(db, email(), issued);
    const later = new Date(issued.getTime() + LOGIN_TOKEN_TTL_MS + 1);
    expect(await redeemLoginToken(db, token, later)).toBeNull();
  });

  it("refuses a made-up token", async () => {
    expect(await redeemLoginToken(db, "not-a-real-token-at-all-123456")).toBeNull();
  });

  it("only stores hashes of tokens", async () => {
    const token = await createLoginToken(db, email());
    const rows = await db.select({ hash: schema.loginTokens.tokenHash }).from(schema.loginTokens);
    expect(rows.some((r) => r.hash === token)).toBe(false);
  });

  it("reuses the same user on a second sign-in", async () => {
    const address = email();
    const first = await redeemLoginToken(db, await createLoginToken(db, address));
    const second = await redeemLoginToken(db, await createLoginToken(db, address));
    expect(second?.user.id).toBe(first?.user.id);
  });

  it("ends a session on sign-out", async () => {
    const result = await redeemLoginToken(db, await createLoginToken(db, email()));
    await deleteSession(db, result!.sessionToken);
    expect(await findSessionUser(db, result!.sessionToken)).toBeNull();
  });
});

describe.skipIf(!hasTestDb)("church access", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  async function pastorOf(name: string) {
    const result = await redeemLoginToken(db, await createLoginToken(db, email()));
    const church = await createChurchForUser(db, result!.user.id, {
      name,
      slug: `${name}-${randomUUID()}`,
      timezone: "America/Chicago",
    });
    const viewer = await staffViewer(db, result!.user);
    return { church, viewer };
  }

  it("lets staff read and write their own church", async () => {
    const { church, viewer } = await pastorOf("a");
    expect(statusOf(() => assertCanWrite(viewer, church.id))).toBeUndefined();
    expect(viewer?.kind === "staff" && viewer.role).toBe("owner");
  });

  it("hides one church's data from another church's staff", async () => {
    const a = await pastorOf("a");
    const b = await pastorOf("b");
    expect(statusOf(() => assertCanRead(a.viewer, b.church.id))).toBe(404);
    expect(statusOf(() => assertCanWrite(a.viewer, b.church.id))).toBe(404);
  });

  it("asks anonymous visitors to sign in", () => {
    expect(statusOf(() => assertCanRead(null, randomUUID()))).toBe(401);
  });

  it("gives a user with no church no viewer", async () => {
    const result = await redeemLoginToken(db, await createLoginToken(db, email()));
    expect(await staffViewer(db, result!.user)).toBeNull();
  });

  it("lets the demo read the demo church but never write", async () => {
    await db
      .insert(schema.churches)
      .values({ name: "Demo", slug: DEMO_CHURCH_SLUG, isDemo: true })
      .onConflictDoNothing();
    const viewer: Viewer = await demoViewer(db);
    expect(statusOf(() => assertCanRead(viewer, viewer.churchId))).toBeUndefined();
    expect(statusOf(() => assertCanWrite(viewer, viewer.churchId))).toBe(403);

    const other = await makeChurchWithSermon(db);
    expect(statusOf(() => assertCanRead(viewer, other.church.id))).toBe(404);
  });
});
