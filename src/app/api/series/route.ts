import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, readJson, route } from "@/lib/http";
import { createSeriesSchema } from "@/sermons/schemas";
import { createSeries, listSeries } from "@/sermons/service";

export const GET = route(async () => {
  return Response.json({ series: await listSeries(getDb(), await getViewer()) });
});

export const POST = route(async (request: Request) => {
  assertSameOrigin(request, getEnv().APP_URL);
  const { title } = await readJson(request, createSeriesSchema);
  const series = await createSeries(getDb(), await getViewer(), title);
  return Response.json({ series }, { status: 201 });
});
