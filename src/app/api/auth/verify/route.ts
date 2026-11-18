import { z } from "zod";
import { staffViewer } from "@/auth/access";
import { redeemLoginToken } from "@/auth/magic-link";
import { setSessionCookie } from "@/auth/session";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, HttpError, readJson, route } from "@/lib/http";

const bodySchema = z.object({ token: z.string().min(20).max(200) });

/**
 * The emailed link opens a page that POSTs here. Spending the token on a GET
 * would let email security scanners, which pre-open links, burn it first.
 */
export const POST = route(async (request: Request) => {
  assertSameOrigin(request, getEnv().APP_URL);
  const { token } = await readJson(request, bodySchema);
  const db = getDb();

  const result = await redeemLoginToken(db, token);
  if (!result) throw new HttpError(400, "This sign-in link has expired or was already used.");

  await setSessionCookie(result.sessionToken, result.expiresAt);
  const viewer = await staffViewer(db, result.user);
  return Response.json({ ok: true, next: viewer ? "/app" : "/app/welcome" });
});
