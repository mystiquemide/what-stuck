import { getDb } from "@/db";
import { unsubscribe } from "@/followups/service";
import { getEnv } from "@/lib/env";
import { route } from "@/lib/route";

type Ctx = RouteContext<"/api/unsubscribe/[token]">;

async function remove(ctx: Ctx) {
  const { token } = await ctx.params;
  if (token.length < 20 || token.length > 100) return;
  await unsubscribe(getDb(), token);
}

/** Link in the email: delete the address, then show a plain confirmation. */
export const GET = route(async (_request: Request, ctx: Ctx) => {
  await remove(ctx);
  return Response.redirect(`${getEnv().APP_URL}/unsubscribed`, 303);
});

/** One-click unsubscribe from mail apps (RFC 8058). */
export const POST = route(async (_request: Request, ctx: Ctx) => {
  await remove(ctx);
  return new Response(null, { status: 204 });
});
