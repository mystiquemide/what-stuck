import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, readJson } from "@/lib/http";
import { route } from "@/lib/route";
import { createSermonSchema } from "@/sermons/schemas";
import { createSermon, listSermons, publicReplyUrl } from "@/sermons/service";

export const GET = route(async () => {
  const sermons = await listSermons(getDb(), await getViewer());
  const appUrl = getEnv().APP_URL;
  return Response.json({
    sermons: sermons.map((s) => ({ ...s, replyUrl: publicReplyUrl(appUrl, s.publicCode) })),
  });
});

export const POST = route(async (request: Request) => {
  const env = getEnv();
  assertSameOrigin(request, env.APP_URL);
  const input = await readJson(request, createSermonSchema);
  const sermon = await createSermon(getDb(), await getViewer(), input);
  return Response.json(
    { sermon: { ...sermon, replyUrl: publicReplyUrl(env.APP_URL, sermon.publicCode) } },
    { status: 201 },
  );
});
