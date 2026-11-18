import { lt, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { rateLimits } from "@/db/schema";
import { keyedHash } from "./crypto";

export type RateLimitRule = { scope: string; limit: number; windowMs: number };

export const RULES = {
  reply: { scope: "reply", limit: 10, windowMs: 60_000 },
  loginByIp: { scope: "login-ip", limit: 10, windowMs: 15 * 60_000 },
  loginByEmail: { scope: "login-email", limit: 5, windowMs: 60 * 60_000 },
} satisfies Record<string, RateLimitRule>;

/**
 * Fixed-window counter in Postgres. One atomic upsert per check, so it holds
 * under concurrent requests. `identity` is hashed with a secret before storage.
 */
export async function checkRateLimit(
  db: Database,
  secret: string,
  rule: RateLimitRule,
  identity: string,
  now = new Date(),
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const windowStartMs = Math.floor(now.getTime() / rule.windowMs) * rule.windowMs;
  const keyHash = keyedHash(secret, `${rule.scope}:${identity}`);

  const [row] = await db
    .insert(rateLimits)
    .values({ keyHash, windowStart: new Date(windowStartMs), count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.keyHash, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  const count = row?.count ?? 1;
  const retryAfterSeconds = Math.ceil((windowStartMs + rule.windowMs - now.getTime()) / 1000);
  return { allowed: count <= rule.limit, retryAfterSeconds };
}

/** Drop counters older than a day. Called from the daily maintenance job. */
export async function purgeOldRateLimits(db: Database, now = new Date()) {
  await db
    .delete(rateLimits)
    .where(lt(rateLimits.windowStart, new Date(now.getTime() - 86_400_000)));
}
