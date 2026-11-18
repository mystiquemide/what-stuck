import { getDb } from "@/db";
import { sendDueNotes } from "@/followups/service";
import { assertCron } from "@/lib/cron";
import { getMailer } from "@/lib/email";
import { getEnv } from "@/lib/env";
import { route } from "@/lib/route";
import { getPassage } from "@/scripture/passage";

/** Every 15 minutes: send Wednesday notes that are due. */
export const POST = route(async (request: Request) => {
  const env = getEnv();
  assertCron(request, env.CRON_SECRET);
  const result = await sendDueNotes(getDb(), {
    mailer: getMailer(),
    appUrl: env.APP_URL,
    passage: getPassage,
  });
  return Response.json(result);
});
