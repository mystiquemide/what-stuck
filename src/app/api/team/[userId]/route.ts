import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, uuidParam } from "@/lib/http";
import { route } from "@/lib/route";
import { removeTeamMember } from "@/team/service";

export const DELETE = route(async (request: Request, ctx: RouteContext<"/api/team/[userId]">) => {
  assertSameOrigin(request, getEnv().APP_URL);
  const userId = uuidParam((await ctx.params).userId);
  await removeTeamMember(getDb(), await getViewer(), userId);
  return new Response(null, { status: 204 });
});
