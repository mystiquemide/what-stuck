import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { uuidParam } from "@/lib/http";
import { route } from "@/lib/route";
import { getSeriesView } from "@/sermons/series-view";

export const GET = route(async (_request: Request, ctx: RouteContext<"/api/series/[id]">) => {
  const id = uuidParam((await ctx.params).id);
  return Response.json(await getSeriesView(getDb(), await getViewer(), id));
});
