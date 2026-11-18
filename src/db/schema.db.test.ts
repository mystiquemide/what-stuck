import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { schema } from "@/db";
import { hasTestDb, makeChurchWithSermon, testDb } from "../../test/db";

describe.skipIf(!hasTestDb)("database constraints", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  it("rejects a reply longer than 500 characters", async () => {
    const { sermon } = await makeChurchWithSermon(db);
    await expect(
      db.insert(schema.responses).values({ sermonId: sermon.id, takeaway: "x".repeat(501) }),
    ).rejects.toThrow();
  });

  it("rejects an empty reply", async () => {
    const { sermon } = await makeChurchWithSermon(db);
    await expect(
      db.insert(schema.responses).values({ sermonId: sermon.id, takeaway: "" }),
    ).rejects.toThrow();
  });

  it("rejects an intended takeaway over 280 characters", async () => {
    const { sermon } = await makeChurchWithSermon(db);
    await expect(
      db
        .update(schema.sermons)
        .set({ intendedTakeaway: "y".repeat(281) })
        .where(eq(schema.sermons.id, sermon.id)),
    ).rejects.toThrow();
  });

  it("stores emails in lowercase only", async () => {
    await expect(db.insert(schema.users).values({ email: "Pastor@Example.com" })).rejects.toThrow();
  });

  it("deletes replies and their contact details when a sermon is deleted", async () => {
    const { sermon } = await makeChurchWithSermon(db);
    const [reply] = await db
      .insert(schema.responses)
      .values({ sermonId: sermon.id, takeaway: "God isn't finished with me." })
      .returning();
    await db.insert(schema.followups).values({
      responseId: reply!.id,
      email: "member@example.com",
      sendAfter: new Date(),
      unsubTokenHash: `hash-${reply!.id}`,
    });

    await db.delete(schema.sermons).where(eq(schema.sermons.id, sermon.id));

    expect(
      await db.select().from(schema.responses).where(eq(schema.responses.sermonId, sermon.id)),
    ).toHaveLength(0);
    expect(
      await db.select().from(schema.followups).where(eq(schema.followups.responseId, reply!.id)),
    ).toHaveLength(0);
  });
});
