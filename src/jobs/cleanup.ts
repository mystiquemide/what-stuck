import { lt, or, isNotNull } from "drizzle-orm";
import type { Database } from "@/db";
import { loginTokens, sessions } from "@/db/schema";
import { purgeEmails } from "@/followups/service";
import { purgeOldRateLimits } from "@/lib/rate-limit";

/** Daily: delete data we no longer need. */
export async function runCleanup(db: Database, now = new Date()) {
  const emails = await purgeEmails(db, now);
  await purgeOldRateLimits(db, now);
  await db
    .delete(loginTokens)
    .where(or(lt(loginTokens.expiresAt, now), isNotNull(loginTokens.usedAt)));
  await db.delete(sessions).where(lt(sessions.expiresAt, now));
  return { emailsDeleted: emails.sent + emails.expired };
}
