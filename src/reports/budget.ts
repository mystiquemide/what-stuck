import type { Database } from "@/db";
import { HttpError } from "@/lib/http";
import { checkRateLimit, type RateLimitRule } from "@/lib/rate-limit";

const DAY_MS = 86_400_000;

export const AI_LIMITS = {
  reportsPerChurchPerDay: 12,
  draftsPerChurchPerDay: 20,
  reportCooldownMs: 60_000,
} as const;

/**
 * Guards our AI credit. Three layers, checked cheapest-first:
 * a short cooldown per sermon, a daily allowance per church, and a hard
 * daily cap for the whole site underneath everything.
 */
export async function spendAi(
  db: Database,
  secret: string,
  kind: "report" | "draft",
  scope: { churchId: string; sermonId: string; siteDailyLimit: number },
  now = new Date(),
) {
  const deny = (message: string, retryAfterSeconds: number) => {
    throw new HttpError(429, message, { retryAfterSeconds });
  };

  if (kind === "report") {
    const cooldown: RateLimitRule = {
      scope: "ai-report-cooldown",
      limit: 1,
      windowMs: AI_LIMITS.reportCooldownMs,
    };
    const c = await checkRateLimit(db, secret, cooldown, scope.sermonId, now);
    if (!c.allowed)
      deny(
        "This report was just built. Give it a minute before building it again.",
        c.retryAfterSeconds,
      );
  }

  const perChurch: RateLimitRule =
    kind === "report"
      ? { scope: "ai-report-church", limit: AI_LIMITS.reportsPerChurchPerDay, windowMs: DAY_MS }
      : { scope: "ai-draft-church", limit: AI_LIMITS.draftsPerChurchPerDay, windowMs: DAY_MS };
  const church = await checkRateLimit(db, secret, perChurch, scope.churchId, now);
  if (!church.allowed) {
    deny(
      kind === "report"
        ? "You've built a lot of reports today. You can build more tomorrow. Every reply is still here to read."
        : "You've asked for a lot of suggestions today. You can write your own question, or ask again tomorrow.",
      church.retryAfterSeconds,
    );
  }

  await spendSiteBudget(db, secret, scope.siteDailyLimit, now);
}

/** The site-wide daily cap on AI calls. Scheduled jobs use this too. */
export async function spendSiteBudget(
  db: Database,
  secret: string,
  siteDailyLimit: number,
  now = new Date(),
) {
  const site = await checkRateLimit(
    db,
    secret,
    { scope: "ai-site", limit: siteDailyLimit, windowMs: DAY_MS },
    "all",
    now,
  );
  if (!site.allowed) {
    throw new HttpError(
      429,
      "Reports are very busy today. Try again tomorrow. Your replies are safe until then.",
      { retryAfterSeconds: site.retryAfterSeconds },
    );
  }
}
