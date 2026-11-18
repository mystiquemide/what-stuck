import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, readJson, uuidParam } from "@/lib/http";
import { route } from "@/lib/route";
import { careFollowUpSchema, setCareFollowUp } from "@/replies/service";

/** Mark, or unmark, that the church team followed up on a reply that may need care. */
export const PATCH = route(
  async (request: Request, ctx: RouteContext<"/api/responses/[id]/care">) => {
    assertSameOrigin(request, getEnv().APP_URL);
    const id = uuidParam((await ctx.params).id);
    const input = await readJson(request, careFollowUpSchema);
    await setCareFollowUp(getDb(), await getViewer(), id, input);
    return Response.json({ ok: true });
  },
);
