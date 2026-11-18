import { ImageResponse } from "next/og";

export const alt = "What Stuck: what your church actually took home from Sunday";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        backgroundColor: "#faf7f2",
        color: "#1c1917",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", fontSize: 34 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            backgroundColor: "#9a3412",
            color: "#faf7f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            marginRight: 20,
          }}
        >
          &ldquo;
        </div>
        What Stuck
      </div>
      <div style={{ fontSize: 76, lineHeight: 1.08, letterSpacing: -1, maxWidth: 1000 }}>
        What did your church actually take home from Sunday?
      </div>
      <div style={{ fontSize: 30, color: "#57534e" }}>
        One question after the sermon. A clear report on Monday.
      </div>
    </div>,
    size,
  );
}
