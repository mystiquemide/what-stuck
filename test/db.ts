import { randomUUID } from "node:crypto";
import { createDb, schema } from "@/db";
import { generatePublicCode } from "@/lib/codes";

export const testDbUrl = process.env.TEST_DATABASE_URL;
export const hasTestDb = Boolean(testDbUrl);

export function testDb() {
  if (!testDbUrl) throw new Error("TEST_DATABASE_URL is not set");
  return createDb(testDbUrl);
}

type Db = ReturnType<typeof testDb>;

/** A fresh church with one open sermon. Unique slugs keep test files independent. */
export async function makeChurchWithSermon(db: Db, overrides: { status?: "open" | "closed" } = {}) {
  const [church] = await db
    .insert(schema.churches)
    .values({ name: "Test Church", slug: `test-${randomUUID()}` })
    .returning();
  if (!church) throw new Error("church insert failed");

  const [sermon] = await db
    .insert(schema.sermons)
    .values({
      churchId: church.id,
      title: "Test Sermon",
      preachedOn: "2026-11-15",
      intendedTakeaway: "God finishes what he starts.",
      publicCode: generatePublicCode(),
      status: overrides.status ?? "open",
    })
    .returning();
  if (!sermon) throw new Error("sermon insert failed");

  return { church, sermon };
}

/** A signed-in pastor who owns a fresh church. */
export async function makeStaff(db: Db) {
  const { createChurchForUser, staffViewer } = await import("@/auth/access");
  const [user] = await db
    .insert(schema.users)
    .values({ email: `pastor-${randomUUID()}@example.com` })
    .returning();
  const church = await createChurchForUser(db, user!.id, {
    name: "Staff Church",
    slug: `staff-${randomUUID()}`,
    timezone: "America/Chicago",
  });
  const viewer = await staffViewer(db, user!);
  if (!viewer) throw new Error("no viewer");
  return { church, viewer, user: user! };
}
