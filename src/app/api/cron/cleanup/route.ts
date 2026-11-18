import { getDb } from "@/db";
import { runCleanup } from "@/jobs/cleanup";
import { assertCron } from "@/lib/cron";
import { getEnv } from "@/lib/env";
import { route } from "@/lib/route";

/** Daily: delete expired emails, sign-in links, sessions and rate-limit counters. */
export const POST = route(async (request: Request) => {
  assertCron(request, getEnv().CRON_SECRET);
  return Response.json(await runCleanup(getDb()));
});
