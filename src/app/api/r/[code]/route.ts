import { getDb } from "@/db";
import { PUBLIC_CODE_PATTERN } from "@/lib/codes";
import { getEnv } from "@/lib/env";
import { clientIp, HttpError, notFound, readJson } from "@/lib/http";
import { route } from "@/lib/route";
import { checkRateLimit, RULES } from "@/lib/rate-limit";
import { replySchema, submitReply } from "@/replies/service";
import { getPublicSermon } from "@/sermons/service";

type Ctx = RouteContext<"/api/r/[code]">;

async function findSermon(ctx: Ctx) {
  const { code } = await ctx.params;
  if (!PUBLIC_CODE_PATTERN.test(code)) throw notFound("We couldn't find that sermon.");
  const sermon = await getPublicSermon(getDb(), code);
  if (!sermon) throw notFound("We couldn't find that sermon.");
  return { code, sermon };
}

/** Public: what the reply page shows. */
export const GET = route(async (_request: Request, ctx: Ctx) => {
  const { sermon } = await findSermon(ctx);
  return Response.json({
    sermon: {
      title: sermon.title,
      scriptureRef: sermon.scriptureRef,
      preachedOn: sermon.preachedOn,
      churchName: sermon.churchName,
      open: sermon.status === "open",
    },
  });
});

/** Public: a member's reply. No account, no name. */
export const POST = route(async (request: Request, ctx: Ctx) => {
  const env = getEnv();
  const { code, sermon } = await findSermon(ctx);
  const db = getDb();

  const limit = await checkRateLimit(
    db,
    env.IP_HASH_SALT,
    RULES.reply,
    `${clientIp(request)}:${code}`,
  );
  if (!limit.allowed) {
    throw new HttpError(429, "That's a lot of replies at once. Please wait a minute.", {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const input = await readJson(request, replySchema);
  const result = await submitReply(db, sermon, input);
  return Response.json({ ok: true, care: result.care }, { status: 201 });
});
