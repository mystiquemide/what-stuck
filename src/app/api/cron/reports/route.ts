import { getDb } from "@/db";
import { runMondayReports } from "@/jobs/monday-reports";
import { assertCron } from "@/lib/cron";
import { getMailer } from "@/lib/email";
import { getEnv } from "@/lib/env";
import { route } from "@/lib/route";
import { spendSiteBudget } from "@/reports/budget";
import { getReportModel } from "@/reports/model";

/** Monday morning: build reports and email pastors. */
export const POST = route(async (request: Request) => {
  const env = getEnv();
  assertCron(request, env.CRON_SECRET);
  const result = await runMondayReports(getDb(), {
    mailer: getMailer(),
    appUrl: env.APP_URL,
    getModel: async () => {
      const model = getReportModel();
      await spendSiteBudget(getDb(), env.IP_HASH_SALT, env.AI_DAILY_LIMIT);
      return model;
    },
  });
  return Response.json(result);
});

/** Vercel Cron calls with GET and the same Bearer secret. */
export const GET = POST;
