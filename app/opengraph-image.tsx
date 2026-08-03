import { ImageResponse } from "next/og";

import { APP_NAME } from "@/lib/constants";

export const runtime = "edge";
export const alt = `${APP_NAME} — Observe. Analyze. Ship with confidence.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "radial-gradient(circle at 20% 20%, #0b3a4a 0%, #050816 45%, #04070f 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#00e5ff",
            fontWeight: 700,
          }}
        >
          {APP_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            Observe. Analyze. Ship with confidence.
          </div>
          <div style={{ fontSize: 28, color: "#cbd5e1", maxWidth: 820 }}>
            Production monitoring, AI analysis, and status pages in one platform.
          </div>
        </div>
        <div style={{ fontSize: 22, color: "#94a3b8" }}>
          zynteksis · production-ready SaaS source
        </div>
      </div>
    ),
    { ...size },
  );
}
