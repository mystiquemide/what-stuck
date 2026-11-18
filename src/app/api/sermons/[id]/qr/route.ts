import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { uuidParam } from "@/lib/http";
import { route } from "@/lib/route";
import { qrPng, qrSvg } from "@/sermons/qr";
import { getSermonForViewer, publicReplyUrl } from "@/sermons/service";

/** QR code for the sermon's reply link. `?format=svg` for print, PNG otherwise. */
export const GET = route(async (request: Request, ctx: RouteContext<"/api/sermons/[id]/qr">) => {
  const id = uuidParam((await ctx.params).id);
  const sermon = await getSermonForViewer(getDb(), await getViewer(), id);
  const url = publicReplyUrl(getEnv().APP_URL, sermon.publicCode);
  const filename = `what-stuck-${sermon.publicCode}`;

  if (new URL(request.url).searchParams.get("format") === "svg") {
    return new Response(await qrSvg(url), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `inline; filename="${filename}.svg"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  }
  return new Response(new Uint8Array(await qrPng(url)), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${filename}.png"`,
      "Cache-Control": "private, max-age=300",
    },
  });
});
