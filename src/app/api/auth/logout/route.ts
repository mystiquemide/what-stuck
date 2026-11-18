import { signOut } from "@/auth/session";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, route } from "@/lib/http";

export const POST = route(async (request: Request) => {
  assertSameOrigin(request, getEnv().APP_URL);
  await signOut();
  return Response.json({ ok: true });
});
