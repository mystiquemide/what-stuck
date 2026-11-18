import { ImageResponse } from "next/og";
import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { uuidParam } from "@/lib/http";
import { route } from "@/lib/route";
import { qrDataUrl } from "@/sermons/qr";
import { getSermonForViewer, publicReplyUrl } from "@/sermons/service";

/**
 * A 1920x1080 slide to drop into ProPresenter, Slides or Keynote at the end
 * of the sermon: the question, the QR code, and a short link to type.
 */
export const GET = route(
  async (_request: Request, ctx: RouteContext<"/api/sermons/[id]/slide">) => {
    const id = uuidParam((await ctx.params).id);
    const sermon = await getSermonForViewer(getDb(), await getViewer(), id);
    const url = publicReplyUrl(getEnv().APP_URL, sermon.publicCode);
    const qr = await qrDataUrl(url, 720);
    const shortUrl = url.replace(/^https?:\/\//, "");

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "120px",
          backgroundColor: "#faf7f2",
          color: "#1c1917",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <div style={{ fontSize: 40, color: "#78716c", marginBottom: 24 }}>{sermon.title}</div>
          <div style={{ fontSize: 110, fontWeight: 700, lineHeight: 1.05 }}>
            What will stick with you?
          </div>
          <div style={{ fontSize: 44, marginTop: 48, color: "#44403c" }}>
            Scan the code or go to
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, marginTop: 8 }}>{shortUrl}</div>
          <div style={{ fontSize: 32, marginTop: 40, color: "#78716c" }}>
            Anonymous. Takes 10 seconds.
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG by Satori, not the browser */}
        <img src={qr} width={640} height={640} alt="" style={{ borderRadius: 32 }} />
      </div>,
      {
        width: 1920,
        height: 1080,
        headers: {
          "Content-Disposition": `inline; filename="what-stuck-slide-${sermon.publicCode}.png"`,
          "Cache-Control": "private, max-age=300",
        },
      },
    );
  },
);
