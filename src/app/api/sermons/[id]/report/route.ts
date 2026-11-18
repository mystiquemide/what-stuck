import { assertCanWrite } from "@/auth/access";
import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, uuidParam } from "@/lib/http";
import { route } from "@/lib/route";
import { getReportModel } from "@/reports/model";
import { spendAi } from "@/reports/budget";
import { generateReport, getReport } from "@/reports/service";
import { getSermonForViewer } from "@/sermons/service";

type Ctx = RouteContext<"/api/sermons/[id]/report">;

export const GET = route(async (_request: Request, ctx: Ctx) => {
  const id = uuidParam((await ctx.params).id);
  return Response.json(await getReport(getDb(), await getViewer(), id));
});

/** Generate or regenerate. Each run is stored with its model and prompt version. */
export const POST = route(async (request: Request, ctx: Ctx) => {
  assertSameOrigin(request, getEnv().APP_URL);
  const id = uuidParam((await ctx.params).id);
  const viewer = await getViewer();
  const db = getDb();

  // Check access before AI setup, so outsiders and the demo learn nothing about config.
  const sermon = await getSermonForViewer(db, viewer, id);
  assertCanWrite(viewer, sermon.churchId);

  const env = getEnv();
  const result = await generateReport(db, viewer, id, async () => {
    const model = getReportModel();
    await spendAi(db, env.IP_HASH_SALT, "report", {
      churchId: sermon.churchId,
      sermonId: sermon.id,
      siteDailyLimit: env.AI_DAILY_LIMIT,
    });
    return model;
  });
  const status = result.status === "ready" ? 201 : result.status === "failed" ? 502 : 200;
  return Response.json(result, { status });
});
