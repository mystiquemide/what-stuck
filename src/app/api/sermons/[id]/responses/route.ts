import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { route, uuidParam } from "@/lib/http";
import { listReplies } from "@/replies/service";

export const GET = route(
  async (_request: Request, ctx: RouteContext<"/api/sermons/[id]/responses">) => {
    const id = uuidParam((await ctx.params).id);
    const replies = await listReplies(getDb(), await getViewer(), id);
    return Response.json({ replies });
  },
);
