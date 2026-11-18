import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db";
import { loginTokens, sessions, users } from "@/db/schema";
import { hashToken, randomToken } from "@/lib/crypto";

export const LOGIN_TOKEN_TTL_MS = 15 * 60_000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60_000;

export const emailSchema = z
  .email("Enter a valid email address.")
  .max(254)
  .transform((value) => value.trim().toLowerCase());

/** Create a single-use sign-in token. Returns the raw token for the email link; only its hash is stored. */
export async function createLoginToken(db: Database, email: string, now = new Date()) {
  const token = randomToken();
  await db.insert(loginTokens).values({
    email,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + LOGIN_TOKEN_TTL_MS),
  });
  return token;
}

/**
 * Spend a sign-in token and open a session. The token is marked used in the
 * same statement that checks it, so a link can't be used twice even if two
 * requests race. Returns null for unknown, used or expired tokens.
 */
export async function redeemLoginToken(db: Database, token: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const [spent] = await tx
      .update(loginTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(loginTokens.tokenHash, hashToken(token)),
          isNull(loginTokens.usedAt),
          gt(loginTokens.expiresAt, now),
        ),
      )
      .returning({ email: loginTokens.email });
    if (!spent) return null;

    const [user] = await tx
      .insert(users)
      .values({ email: spent.email })
      .onConflictDoUpdate({ target: users.email, set: { email: spent.email } })
      .returning();
    if (!user) throw new Error("Could not load user for sign-in.");

    const sessionToken = randomToken();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    await tx
      .insert(sessions)
      .values({ tokenHash: hashToken(sessionToken), userId: user.id, expiresAt });

    return { user, sessionToken, expiresAt };
  });
}

export async function findSessionUser(db: Database, sessionToken: string, now = new Date()) {
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashToken(sessionToken)), gt(sessions.expiresAt, now)))
    .limit(1);
  return row?.user ?? null;
}

export async function deleteSession(db: Database, sessionToken: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(sessionToken)));
}
