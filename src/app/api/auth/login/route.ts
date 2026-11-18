import { z } from "zod";
import { createLoginToken, emailSchema } from "@/auth/magic-link";
import { getDb } from "@/db";
import { loginEmail } from "@/emails/login";
import { getMailer } from "@/lib/email";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, clientIp, HttpError, readJson } from "@/lib/http";
import { route } from "@/lib/route";
import { checkRateLimit, RULES } from "@/lib/rate-limit";

const bodySchema = z.object({ email: emailSchema });

export const POST = route(async (request: Request) => {
  const env = getEnv();
  assertSameOrigin(request, env.APP_URL);
  const { email } = await readJson(request, bodySchema);
  const db = getDb();

  for (const [rule, identity] of [
    [RULES.loginByIp, clientIp(request)],
    [RULES.loginByEmail, email],
  ] as const) {
    const limit = await checkRateLimit(db, env.IP_HASH_SALT, rule, identity);
    if (!limit.allowed) {
      throw new HttpError(429, "Too many sign-in attempts. Try again in a few minutes.", {
        retryAfterSeconds: limit.retryAfterSeconds,
      });
    }
  }

  const token = await createLoginToken(db, email);
  const link = `${env.APP_URL}/auth/verify?token=${encodeURIComponent(token)}`;
  await getMailer().send(loginEmail(email, link));

  // Same answer whether or not the address has an account.
  return Response.json({ ok: true });
});
