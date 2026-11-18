import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { HttpError } from "@/lib/http";
import { hasTestDb, testDb } from "../../test/db";
import { AI_LIMITS, spendAi, spendSiteBudget } from "./budget";

const secret = "budget-test-salt";

async function denial(promise: Promise<unknown>) {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof HttpError
      ? { status: error.status, message: error.message }
      : { status: -1, message: String(error) };
  }
}

describe.skipIf(!hasTestDb)("AI budget", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  it("makes a pastor wait a minute between rebuilds of the same report", async () => {
    const scope = { churchId: randomUUID(), sermonId: randomUUID(), siteDailyLimit: 1000 };
    const t0 = new Date("2026-11-20T10:00:00Z");
    expect(await denial(spendAi(db, secret, "report", scope, t0))).toBeNull();
    const second = await denial(
      spendAi(db, secret, "report", scope, new Date(t0.getTime() + 5_000)),
    );
    expect(second?.status).toBe(429);
    expect(second?.message).toMatch(/just built/);
    expect(
      await denial(spendAi(db, secret, "report", scope, new Date(t0.getTime() + 61_000))),
    ).toBeNull();
  });

  it("caps reports per church per day, with a plain message", async () => {
    const churchId = randomUUID();
    const day = new Date("2026-11-21T09:00:00Z");
    for (let i = 0; i < AI_LIMITS.reportsPerChurchPerDay; i++) {
      expect(
        await denial(
          spendAi(
            db,
            secret,
            "report",
            { churchId, sermonId: randomUUID(), siteDailyLimit: 1000 },
            day,
          ),
        ),
      ).toBeNull();
    }
    const over = await denial(
      spendAi(
        db,
        secret,
        "report",
        { churchId, sermonId: randomUUID(), siteDailyLimit: 1000 },
        day,
      ),
    );
    expect(over?.message).toMatch(/You can build more tomorrow/);
    expect(over?.message).not.toMatch(/rate|limit|quota|429/i);
  });

  it("keeps one church's use from blocking another", async () => {
    const day = new Date("2026-11-22T09:00:00Z");
    const busy = randomUUID();
    for (let i = 0; i <= AI_LIMITS.draftsPerChurchPerDay; i++) {
      await denial(
        spendAi(db, secret, "draft", { churchId: busy, sermonId: "x", siteDailyLimit: 1000 }, day),
      );
    }
    expect(
      await denial(
        spendAi(
          db,
          secret,
          "draft",
          { churchId: randomUUID(), sermonId: "y", siteDailyLimit: 1000 },
          day,
        ),
      ),
    ).toBeNull();
  });

  it("stops everything once the site-wide daily cap is reached", async () => {
    const day = new Date("2026-11-23T09:00:00Z");
    await spendSiteBudget(db, `${secret}-site`, 2, day);
    await spendSiteBudget(db, `${secret}-site`, 2, day);
    const over = await denial(spendSiteBudget(db, `${secret}-site`, 2, day));
    expect(over?.message).toMatch(/very busy today/);
  });
});
