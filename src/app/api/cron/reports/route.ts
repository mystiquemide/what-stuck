import { getDb } from "@/db";
import { runMondayReports } from "@/jobs/monday-reports";
import { assertCron } from "@/lib/cron";
import { getMailer } from "@/lib/email";
import { getEnv } from "@/lib/env";
import { route } from "@/lib/route";
import { getReportModel } from "@/reports/model";

/** Monday morning: build reports and email pastors. */
export const POST = route(async (request: Request) => {
  const env = getEnv();
  assertCron(request, env.CRON_SECRET);
  const result = await runMondayReports(getDb(), {
    mailer: getMailer(),
    appUrl: env.APP_URL,
    getModel: getReportModel,
  });
  return Response.json(result);
});
