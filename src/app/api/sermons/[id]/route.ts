import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, readJson, uuidParam } from "@/lib/http";
import { route } from "@/lib/route";
import { updateSermonSchema } from "@/sermons/schemas";
import { getSermonForViewer, publicReplyUrl, updateSermon } from "@/sermons/service";

type Ctx = RouteContext<"/api/sermons/[id]">;

export const GET = route(async (_request: Request, ctx: Ctx) => {
  const id = uuidParam((await ctx.params).id);
  const sermon = await getSermonForViewer(getDb(), await getViewer(), id);
  return Response.json({
    sermon: { ...sermon, replyUrl: publicReplyUrl(getEnv().APP_URL, sermon.publicCode) },
  });
});

export const PATCH = route(async (request: Request, ctx: Ctx) => {
  assertSameOrigin(request, getEnv().APP_URL);
  const id = uuidParam((await ctx.params).id);
  const input = await readJson(request, updateSermonSchema);
  const sermon = await updateSermon(getDb(), await getViewer(), id, input);
  return Response.json({ sermon });
});
