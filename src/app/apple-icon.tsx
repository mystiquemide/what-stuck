import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iPhones and iPads (they don't use SVG favicons). */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#9a3412",
      }}
    >
      <svg width="120" height="120" viewBox="0 0 64 64">
        <path
          d="M27 20c-6 2-11 8-11 16v9h12V33h-6c0-5 3-8 7-9l-2-4Zm19 0c-6 2-11 8-11 16v9h12V33h-6c0-5 3-8 7-9l-2-4Z"
          fill="#faf7f2"
        />
      </svg>
    </div>,
    size,
  );
}
