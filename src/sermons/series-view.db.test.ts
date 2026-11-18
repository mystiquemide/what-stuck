import { afterAll, describe, expect, it } from "vitest";
import { HttpError } from "@/lib/http";
import type { ReportModel } from "@/reports/model";
import { generateReport } from "@/reports/service";
import { replySchema, submitReply } from "@/replies/service";
import { hasTestDb, makeStaff, testDb } from "../../test/db";
import { createSermonSchema } from "./schemas";
import { getSeriesView } from "./series-view";
import { createSeries, createSermon } from "./service";

const model = (level: "close" | "different"): ReportModel => ({
  name: "scripted",
  run: async () => ({
    stopReason: "end_turn",
    output: {
      alignment: { level, reason: "r" },
      summary: "s",
      themes: [
        { label: "Main", summary: "s", reply_ids: ["r1", "r2"] },
        { label: "Side", summary: "s", reply_ids: ["r3"] },
      ],
      drift: level === "different" ? [{ heard: "h", reply_ids: ["r3"] }] : [],
      questions: [],
      care: [],
    },
  }),
});

describe.skipIf(!hasTestDb)("getSeriesView", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  it("shows each week's alignment and top themes in date order", async () => {
    const { viewer } = await makeStaff(db);
    const s = await createSeries(db, viewer, "Philippians");
    const weeks = [
      ["2026-11-08", "close"],
      ["2026-11-01", "different"],
      ["2026-11-15", null],
    ] as const;
    for (const [date, level] of weeks) {
      const sermon = await createSermon(
        db,
        viewer,
        createSermonSchema.parse({
          title: date,
          preachedOn: date,
          intendedTakeaway: "x",
          seriesId: s.id,
        }),
      );
      for (const t of ["a", "b", "c"])
        await submitReply(db, sermon, replySchema.parse({ takeaway: t }));
      if (level) await generateReport(db, viewer, sermon.id, () => model(level));
    }

    const view = await getSeriesView(db, viewer, s.id);
    expect(view.weeks.map((w) => [w.preachedOn, w.alignment, w.replyCount])).toEqual([
      ["2026-11-01", "different", 3],
      ["2026-11-08", "close", 3],
      ["2026-11-15", null, 3],
    ]);
    expect(view.weeks[0]!.topThemes[0]).toEqual({ label: "Main", count: 2 });
    expect(view.weeks[0]!.driftCount).toBe(1);
  });

  it("is private to the church", async () => {
    const a = await makeStaff(db);
    const b = await makeStaff(db);
    const s = await createSeries(db, a.viewer, "Mine");
    await expect(getSeriesView(db, b.viewer, s.id)).rejects.toSatisfy(
      (e) => e instanceof HttpError && e.status === 404,
    );
  });
});
