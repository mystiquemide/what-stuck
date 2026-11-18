import { requireViewer } from "@/auth/access";
import { getViewer } from "@/auth/session";
import { churchSettingsSchema, getChurchSettings, updateChurchSettings } from "@/churches/settings";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, readJson } from "@/lib/http";
import { route } from "@/lib/route";

export const GET = route(async () => {
  const viewer = requireViewer(await getViewer());
  return Response.json({ settings: await getChurchSettings(getDb(), viewer) });
});

export const PATCH = route(async (request: Request) => {
  assertSameOrigin(request, getEnv().APP_URL);
  const viewer = await getViewer();
  const input = await readJson(request, churchSettingsSchema);
  return Response.json({ settings: await updateChurchSettings(getDb(), viewer, input) });
});
