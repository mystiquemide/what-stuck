import { timingSafeEqual } from "node:crypto";
import { unauthorized } from "./http";

/** Scheduled jobs call with `Authorization: Bearer <CRON_SECRET>`. Constant-time compare. */
export function assertCron(request: Request, secret: string): void {
  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw unauthorized();
}
