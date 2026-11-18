import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { schema } from "@/db";
import { DEMO_CHURCH_SLUG } from "@/lib/demo";
import type { ReportModel } from "@/reports/model";
import { hasTestDb, testDb } from "../../test/db";
import { generateDemoReports, seedDemo } from "./seed";
import { demoSermons } from "./seed-data";

const model: ReportModel = {
  name: "scripted",
  run: async () => ({
    stopReason: "end_turn",
    output: {
      alignment: { level: "close", reason: "r" },
      summary: "s",
      themes: [{ label: "t", summary: "s", reply_ids: ["r1", "r2"] }],
      drift: [],
      questions: [],
      care: [],
    },
  }),
};

describe.skipIf(!hasTestDb)("demo church", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  it("is created once, then left alone on later startups", async () => {
    await seedDemo(db, { replace: true });
    expect((await seedDemo(db)).created).toBe(false);
    const [church] = await db
      .select()
      .from(schema.churches)
      .where(eq(schema.churches.slug, DEMO_CHURCH_SLUG));
    const sermons = await db
      .select()
      .from(schema.sermons)
      .where(eq(schema.sermons.churchId, church!.id));
    expect(church?.isDemo).toBe(true);
    expect(sermons).toHaveLength(demoSermons.length);
    expect(sermons.filter((s) => s.status === "open")).toHaveLength(1);
  });

  it("builds reports only for demo sermons that don't have one", async () => {
    await seedDemo(db, { replace: true });
    expect(await generateDemoReports(db, () => model)).toEqual(["ready", "ready", "ready"]);
    expect(await generateDemoReports(db, () => model)).toEqual([]);
  });
});
