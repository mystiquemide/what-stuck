import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { schema } from "@/db";
import { hasTestDb, testDb } from "../../test/db";
import { checkRateLimit, purgeOldRateLimits } from "./rate-limit";

const rule = { scope: "test", limit: 3, windowMs: 60_000 };
const secret = "test-secret-salt";

describe.skipIf(!hasTestDb)("checkRateLimit", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  it("allows up to the limit, then blocks", async () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 250)}-${randomUUID()}`;
    const now = new Date("2026-11-18T10:00:05Z");
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await checkRateLimit(db, secret, rule, ip, now));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3]!.retryAfterSeconds).toBe(55);
  });

  it("starts fresh in the next window", async () => {
    const ip = randomUUID();
    const t0 = new Date("2026-11-18T10:00:00Z");
    for (let i = 0; i < 4; i++) await checkRateLimit(db, secret, rule, ip, t0);
    const next = await checkRateLimit(db, secret, rule, ip, new Date("2026-11-18T10:01:00Z"));
    expect(next.allowed).toBe(true);
  });

  it("holds under concurrent requests", async () => {
    const ip = randomUUID();
    const now = new Date("2026-11-18T11:00:00Z");
    const results = await Promise.all(
      Array.from({ length: 10 }, () => checkRateLimit(db, secret, rule, ip, now)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
  });

  it("never stores the raw identity", async () => {
    const ip = `198.51.100.7-${randomUUID()}`;
    await checkRateLimit(db, secret, rule, ip);
    const rows = await db.select().from(schema.rateLimits);
    expect(rows.some((r) => r.keyHash.includes(ip))).toBe(false);
  });

  it("purges counters older than a day", async () => {
    const ip = randomUUID();
    await checkRateLimit(db, secret, rule, ip, new Date("2026-01-01T00:00:00Z"));
    await purgeOldRateLimits(db, new Date("2026-01-03T00:00:00Z"));
    const rows = await db.select().from(schema.rateLimits);
    expect(
      rows.some((r) => r.windowStart.getTime() === new Date("2026-01-01T00:00:00Z").getTime()),
    ).toBe(false);
  });
});
