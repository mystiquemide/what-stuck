import { and, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { churches, memberships } from "@/db/schema";
import { forbidden, notFound, unauthorized } from "@/lib/http";
import { DEMO_CHURCH_SLUG } from "@/lib/demo";

type User = { id: string; email: string };

/**
 * Who is looking at the pastor side of the app.
 * - staff: a signed-in member of one church, can read and write that church.
 * - demo: anyone who opened the demo, can read the demo church only.
 */
export type Viewer =
  | { kind: "staff"; user: User; churchId: string; role: "owner" | "editor"; canWrite: true }
  | { kind: "demo"; churchId: string; canWrite: false };

export async function staffViewer(db: Database, user: User): Promise<Viewer | null> {
  const [membership] = await db
    .select({ churchId: memberships.churchId, role: memberships.role })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .orderBy(memberships.createdAt)
    .limit(1);
  if (!membership) return null;
  return { kind: "staff", user, ...membership, canWrite: true };
}

export async function demoViewer(db: Database): Promise<Viewer> {
  const [church] = await db
    .select({ id: churches.id })
    .from(churches)
    .where(and(eq(churches.slug, DEMO_CHURCH_SLUG), eq(churches.isDemo, true)))
    .limit(1);
  if (!church) throw notFound("The demo church hasn't been set up.");
  return { kind: "demo", churchId: church.id, canWrite: false };
}

/** Throws unless the viewer belongs to `churchId`. Use before every read of church data. */
export function assertCanRead(viewer: Viewer | null, churchId: string): asserts viewer is Viewer {
  if (!viewer) throw unauthorized();
  // Same response for "other church" and "doesn't exist", so IDs can't be probed.
  if (viewer.churchId !== churchId) throw notFound();
}

/** Throws unless the viewer can change data in `churchId`. Demo viewers never can. */
export function assertCanWrite(
  viewer: Viewer | null,
  churchId: string,
): asserts viewer is Extract<Viewer, { kind: "staff" }> {
  assertCanRead(viewer, churchId);
  if (!viewer.canWrite) throw forbidden("The demo is read-only.");
}

export async function createChurchForUser(
  db: Database,
  userId: string,
  input: { name: string; slug: string; timezone: string },
) {
  return db.transaction(async (tx) => {
    const [church] = await tx.insert(churches).values(input).returning();
    if (!church) throw new Error("Could not create church.");
    await tx.insert(memberships).values({ userId, churchId: church.id, role: "owner" });
    return church;
  });
}

export function requireViewer(viewer: Viewer | null): Viewer {
  if (!viewer) throw unauthorized();
  return viewer;
}

/**
 * Write access to one church for scheduled jobs and scripts, never for requests.
 * Every service still checks that records belong to this church.
 */
export function systemViewer(churchId: string): Viewer {
  return {
    kind: "staff",
    user: { id: "system", email: "system@localhost" },
    churchId,
    role: "owner",
    canWrite: true,
  };
}
