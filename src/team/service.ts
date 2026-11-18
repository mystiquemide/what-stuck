import { and, asc, eq } from "drizzle-orm";
import { assertCanRead, assertOwner, requireViewer, type Viewer } from "@/auth/access";
import type { Database } from "@/db";
import { churches, memberships, users } from "@/db/schema";
import { HttpError } from "@/lib/http";

export async function listTeam(db: Database, maybeViewer: Viewer | null) {
  const viewer = requireViewer(maybeViewer);
  assertCanRead(viewer, viewer.churchId);
  return db
    .select({
      userId: users.id,
      email: users.email,
      role: memberships.role,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.churchId, viewer.churchId))
    .orderBy(asc(memberships.createdAt));
}

/**
 * Add a deacon, care-team member or staff member by email. They sign in with
 * that address and see this church's sermons and reports.
 */
export async function addTeamMember(db: Database, maybeViewer: Viewer | null, email: string) {
  const viewer = requireViewer(maybeViewer);
  assertOwner(viewer, viewer.churchId);

  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email })
      .onConflictDoUpdate({ target: users.email, set: { email } })
      .returning();
    if (!user) throw new Error("Could not load user.");

    const [existing] = await tx
      .select({ churchId: memberships.churchId })
      .from(memberships)
      .where(eq(memberships.userId, user.id));
    if (existing?.churchId === viewer.churchId) {
      throw new HttpError(409, `${email} is already on your team.`);
    }
    if (existing) {
      throw new HttpError(409, "This person already belongs to another church on What Stuck.");
    }

    await tx
      .insert(memberships)
      .values({ userId: user.id, churchId: viewer.churchId, role: "editor" });
    const [church] = await tx
      .select({ name: churches.name })
      .from(churches)
      .where(eq(churches.id, viewer.churchId));
    return { userId: user.id, email: user.email, churchName: church?.name ?? "your church" };
  });
}

export async function removeTeamMember(db: Database, maybeViewer: Viewer | null, userId: string) {
  const viewer = requireViewer(maybeViewer);
  assertOwner(viewer, viewer.churchId);
  if (userId === viewer.user.id)
    throw new HttpError(400, "You can't remove yourself from your own church.");

  const removed = await db
    .delete(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.churchId, viewer.churchId)))
    .returning({ userId: memberships.userId });
  if (removed.length === 0) throw new HttpError(404, "That person isn't on your team anymore.");
}
