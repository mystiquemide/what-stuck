import { signOut } from "@/auth/session";
import { getEnv } from "@/lib/env";
import { assertSameOrigin } from "@/lib/http";
import { route } from "@/lib/route";

export const POST = route(async (request: Request) => {
  assertSameOrigin(request, getEnv().APP_URL);
  await signOut();
  return Response.json({ ok: true });
});
