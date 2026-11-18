import { afterAll, describe, expect, it } from "vitest";
import type { EmailMessage, Mailer } from "@/lib/email";
import type { ReportModel } from "@/reports/model";
import { replySchema, submitReply } from "@/replies/service";
import { createSermonSchema } from "@/sermons/schemas";
import { createSermon } from "@/sermons/service";
import { hasTestDb, makeStaff, testDb } from "../../test/db";
import { runMondayReports } from "./monday-reports";

const model = (): ReportModel => ({
  name: "scripted",
  run: async () => ({
    stopReason: "end_turn",
    output: {
      alignment: { level: "close", reason: "r" },
      summary: "s",
      themes: [{ label: "Grace", summary: "s", reply_ids: ["r1", "r2"] }],
      drift: [],
      questions: [],
      care: [],
    },
  }),
});

describe.skipIf(!hasTestDb)("runMondayReports", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  it("builds reports for recent sermons and emails the church's staff once", async () => {
    const { viewer, user } = await makeStaff(db);
    const sermon = await createSermon(
      db,
      viewer,
      createSermonSchema.parse({
        title: "Monday Test",
        preachedOn: "2026-11-15",
        intendedTakeaway: "Grace.",
      }),
    );
    for (const t of ["a", "b", "c"])
      await submitReply(db, sermon, replySchema.parse({ takeaway: t }));

    const sent: EmailMessage[] = [];
    const mailer: Mailer = { send: async (m) => void sent.push(m) };
    const deps = { mailer, appUrl: "https://whatstuck.example", getModel: model };
    const monday = new Date("2026-11-16T14:00:00Z");

    await runMondayReports(db, deps, monday);
    const mine = sent.filter((m) => m.to === user.email);
    expect(mine).toHaveLength(1);
    expect(mine[0]!.text).toContain(`https://whatstuck.example/app/sermons/${sermon.id}/report`);
    expect(mine[0]!.text).toContain("3 people");

    await runMondayReports(db, deps, monday);
    expect(sent.filter((m) => m.to === user.email)).toHaveLength(1);
  });
});
