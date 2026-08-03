import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Rounded, premium application icon (Apple touch / PWA). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #04070d, #0b1220)",
          borderRadius: 40,
        }}
      >
        <svg width="132" height="132" viewBox="0 0 64 64" fill="none">
          <path
            d="M32 32 C 27 20, 10 20, 10 32 C 10 44, 27 44, 32 32 C 37 20, 54 20, 54 32 C 54 44, 37 44, 32 32 Z"
            stroke="#00e5ff"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="32" r="3.2" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
