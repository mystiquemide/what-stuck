import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, readJson, uuidParam } from "@/lib/http";
import { route } from "@/lib/route";
import { approveReflection, draftReflection, reflectionSchema } from "@/reflection/service";
import { spendAi } from "@/reports/budget";
import { getReflectionDrafter } from "@/reports/model";

type Ctx = RouteContext<"/api/sermons/[id]/reflection">;

/** Ask AI for a suggested question. Saved as an unapproved draft. */
export const POST = route(async (request: Request, ctx: Ctx) => {
  assertSameOrigin(request, getEnv().APP_URL);
  const id = uuidParam((await ctx.params).id);
  const env = getEnv();
  const db = getDb();
  const viewer = await getViewer();
  const question = await draftReflection(db, viewer, id, async () => {
    const drafter = getReflectionDrafter();
    await spendAi(db, env.IP_HASH_SALT, "draft", {
      churchId: viewer?.churchId ?? "",
      sermonId: id,
      siteDailyLimit: env.AI_DAILY_LIMIT,
    });
    return drafter;
  });
  return Response.json({ question, approved: false });
});

/** Save the pastor's wording and approve it. */
export const PUT = route(async (request: Request, ctx: Ctx) => {
  assertSameOrigin(request, getEnv().APP_URL);
  const id = uuidParam((await ctx.params).id);
  const { question } = await readJson(request, reflectionSchema);
  await approveReflection(getDb(), await getViewer(), id, question);
  return Response.json({ question, approved: true });
});
