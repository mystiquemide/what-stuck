import { z } from "zod";
import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, readJson, uuidParam } from "@/lib/http";
import { route } from "@/lib/route";
import { setReplyHidden } from "@/replies/service";

const bodySchema = z.object({ hidden: z.boolean() });

/** Pastors can hide spam or off-topic replies. Hidden replies stay out of reports. */
export const PATCH = route(async (request: Request, ctx: RouteContext<"/api/responses/[id]">) => {
  assertSameOrigin(request, getEnv().APP_URL);
  const id = uuidParam((await ctx.params).id);
  const { hidden } = await readJson(request, bodySchema);
  await setReplyHidden(getDb(), await getViewer(), id, hidden);
  return Response.json({ ok: true });
});
