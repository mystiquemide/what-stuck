import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { schema } from "@/db";
import type { EmailMessage, Mailer } from "@/lib/email";
import { approveReflection } from "@/reflection/service";
import { replySchema, setReplyHidden, submitReply } from "@/replies/service";
import type { Passage } from "@/scripture/passage";
import { createSermonSchema } from "@/sermons/schemas";
import { createSermon } from "@/sermons/service";
import { hasTestDb, makeStaff, testDb } from "../../test/db";
import { purgeEmails, sendDueNotes, unsubscribe } from "./service";

class InboxMailer implements Mailer {
  readonly sent: EmailMessage[] = [];
  constructor(private readonly fail = false) {}
  async send(message: EmailMessage) {
    if (this.fail) throw new Error("provider down");
    this.sent.push(message);
  }
}

const passage: Passage = {
  reference: "Philippians 1:6",
  text: "being confident of this, that He who began a good work in you will carry it on to completion",
  attribution: "Berean Standard Bible",
  attributionUrls: ["https://berean.bible/"],
  readUrl: "https://route.bible/PHP.1.6",
};

const sunday = "2026-11-15";
const afterService = new Date("2026-11-15T18:00:00Z");
const wednesdayMorning = new Date("2026-11-18T15:30:00Z");

describe.skipIf(!hasTestDb)("Wednesday notes", () => {
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
        title: "Not Finished Yet",
        preachedOn: sunday,
        scriptureRef: "Philippians 1:6",
        intendedTakeaway: "God finishes what he starts.",
      }),
    );
    const member = { ...sermon, churchTimezone: "America/Chicago" };
    return { ...staff, sermon, member };
  }

  const deps = (mailer: Mailer) => ({
    mailer,
    appUrl: "https://whatstuck.example",
    passage: async () => passage,
  });

  async function emailsFor(sermonId: string) {
    return db
      .select({ email: schema.followups.email, sentAt: schema.followups.sentAt })
      .from(schema.followups)
      .innerJoin(schema.responses, eq(schema.responses.id, schema.followups.responseId))
      .where(eq(schema.responses.sermonId, sermonId));
  }

  it("schedules a note for 9 AM Wednesday, church time", async () => {
    const { member } = await setup();
    const result = await submitReply(
      db,
      member,
      replySchema.parse({ takeaway: "God isn't done with me", email: " Member@Example.com " }),
      afterService,
    );
    expect(result.noteScheduled).toBe(true);
    const [row] = await db
      .select()
      .from(schema.followups)
      .where(eq(schema.followups.responseId, result.responseId!));
    expect(row?.email).toBe("member@example.com");
    expect(row?.sendAfter.toISOString()).toBe("2026-11-18T15:00:00.000Z");
  });

  it("doesn't schedule once the week has passed", async () => {
    const { member } = await setup();
    const result = await submitReply(
      db,
      member,
      replySchema.parse({ takeaway: "late", email: "a@example.com" }),
      new Date("2026-11-25T12:00:00Z"),
    );
    expect(result.noteScheduled).toBe(false);
  });

  it("rejects a bad email address", () => {
    expect(() => replySchema.parse({ takeaway: "x", email: "not-an-email" })).toThrow();
    expect(replySchema.parse({ takeaway: "x", email: "  " }).email).toBeUndefined();
  });

  it("waits for the pastor to approve the question, then sends their exact words", async () => {
    const { viewer, sermon, member } = await setup();
    const takeaway = "God <isn't> finished with me & that's \"good\"";
    await submitReply(
      db,
      member,
      replySchema.parse({ takeaway, email: "m@example.com" }),
      afterService,
    );

    const mailer = new InboxMailer();
    const before = await sendDueNotes(db, deps(mailer), wednesdayMorning);
    expect(before.waitingForApproval).toBeGreaterThanOrEqual(1);
    expect(mailer.sent.filter((m) => m.to === "m@example.com")).toHaveLength(0);

    await approveReflection(db, viewer, sermon.id, "Where do you feel unfinished this week?");
    await sendDueNotes(db, deps(mailer), wednesdayMorning);
    const note = mailer.sent.find((m) => m.to === "m@example.com")!;
    expect(note.text).toContain(`"${takeaway}"`);
    expect(note.text).toContain("Where do you feel unfinished this week?");
    expect(note.text).toContain(passage.text!);
    expect(note.text).toContain("Berean Standard Bible");
    expect(note.html).toContain(
      "God &lt;isn&#39;t&gt; finished with me &amp; that&#39;s &quot;good&quot;",
    );
    expect(note.html).not.toContain("<isn't>");
    expect(note.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");

    expect((await emailsFor(sermon.id))[0]?.sentAt).not.toBeNull();
    const again = new InboxMailer();
    await sendDueNotes(db, deps(again), wednesdayMorning);
    expect(again.sent.filter((m) => m.to === "m@example.com")).toHaveLength(0);
  });

  it("sends the note in Spanish, with the Spanish passage, to a member who replied in Spanish", async () => {
    const { viewer, sermon, member } = await setup();
    await submitReply(
      db,
      member,
      replySchema.parse({
        takeaway: "Dios no ha terminado conmigo.",
        email: "es@example.com",
        locale: "es",
      }),
      afterService,
    );
    await approveReflection(db, viewer, sermon.id, "What will you carry this week?");
    const asked: string[] = [];
    const mailer = new InboxMailer();
    await sendDueNotes(
      db,
      {
        ...deps(mailer),
        passage: async (_ref: string | null, locale: string) => {
          asked.push(locale);
          return passage;
        },
      },
      wednesdayMorning,
    );
    const note = mailer.sent.find((m) => m.to === "es@example.com")!;
    expect(asked).toContain("es");
    expect(note.text).toContain("El domingo dijiste:");
    expect(note.text).toContain('"Dios no ha terminado conmigo."');
  });

  it("doesn't send before the scheduled time", async () => {
    const { viewer, sermon, member } = await setup();
    await approveReflection(db, viewer, sermon.id, "What will you carry this week?");
    await submitReply(
      db,
      member,
      replySchema.parse({ takeaway: "x", email: "early@example.com" }),
      afterService,
    );
    const mailer = new InboxMailer();
    await sendDueNotes(db, deps(mailer), new Date("2026-11-17T12:00:00Z"));
    expect(mailer.sent.filter((m) => m.to === "early@example.com")).toHaveLength(0);
  });

  it("keeps failed sends queued for the next run", async () => {
    const { viewer, sermon, member } = await setup();
    await approveReflection(db, viewer, sermon.id, "What will you carry this week?");
    await submitReply(
      db,
      member,
      replySchema.parse({ takeaway: "x", email: "retry@example.com" }),
      afterService,
    );
    const errorLog = console.error;
    console.error = () => {};
    await sendDueNotes(db, deps(new InboxMailer(true)), wednesdayMorning);
    console.error = errorLog;
    expect((await emailsFor(sermon.id))[0]?.sentAt).toBeNull();
  });

  it("skips notes for replies the pastor hid", async () => {
    const { viewer, sermon, member } = await setup();
    await approveReflection(db, viewer, sermon.id, "What will you carry this week?");
    const { responseId } = await submitReply(
      db,
      member,
      replySchema.parse({ takeaway: "spam", email: "spam@example.com" }),
      afterService,
    );
    await setReplyHidden(db, viewer, responseId!, true);
    const mailer = new InboxMailer();
    await sendDueNotes(db, deps(mailer), wednesdayMorning);
    expect(mailer.sent.filter((m) => m.to === "spam@example.com")).toHaveLength(0);
  });

  it("deletes the address when the unsubscribe link is used", async () => {
    const { viewer, sermon, member } = await setup();
    await approveReflection(db, viewer, sermon.id, "What will you carry this week?");
    await submitReply(
      db,
      member,
      replySchema.parse({ takeaway: "x", email: "bye@example.com" }),
      afterService,
    );
    const mailer = new InboxMailer();
    await sendDueNotes(db, deps(mailer), wednesdayMorning);
    const note = mailer.sent.find((m) => m.to === "bye@example.com")!;
    const token = note.text.match(/unsubscribe\/([A-Za-z0-9_-]+)/)![1]!;

    expect(await unsubscribe(db, "x".repeat(43))).toBe(false);
    expect(await unsubscribe(db, token)).toBe(true);
    expect(await emailsFor(sermon.id)).toHaveLength(0);
    expect(await unsubscribe(db, token)).toBe(false);
  });

  it("deletes sent addresses after 14 days and unsent ones after the week", async () => {
    const { viewer, sermon, member } = await setup();
    await submitReply(
      db,
      member,
      replySchema.parse({ takeaway: "x", email: "never@example.com" }),
      afterService,
    );
    await purgeEmails(db, new Date("2026-11-24T00:00:00Z"));
    expect(await emailsFor(sermon.id)).toHaveLength(1);
    await purgeEmails(db, new Date("2026-11-26T00:00:00Z"));
    expect(await emailsFor(sermon.id)).toHaveLength(0);

    await approveReflection(db, viewer, sermon.id, "What will you carry this week?");
    await submitReply(
      db,
      member,
      replySchema.parse({ takeaway: "x", email: "sent@example.com" }),
      afterService,
    );
    await sendDueNotes(db, deps(new InboxMailer()), wednesdayMorning);
    await purgeEmails(db, new Date("2026-11-30T00:00:00Z"));
    expect(await emailsFor(sermon.id)).toHaveLength(1);
    await purgeEmails(db, new Date("2026-12-03T00:00:00Z"));
    expect(await emailsFor(sermon.id)).toHaveLength(0);
  });
});
