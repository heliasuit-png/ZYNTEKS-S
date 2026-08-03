import { useId } from "react";

interface LogoMarkProps {
  size?: number;
  className?: string;
  /** Accessible label. When omitted the mark is decorative (aria-hidden). */
  title?: string;
  /** Adds a soft neon drop-glow. */
  glow?: boolean;
}

/**
 * ZYNTEKSIS brand mark — an abstract infinity symbol.
 *
 * A single continuous figure-eight (∞) rendered in the electric-cyan →
 * blue → royal-purple brand gradient, with a glowing core node at the
 * crossing point. Represents continuous monitoring and boundless
 * intelligence. Scales cleanly from 16px favicons to hero sizes.
 */
export function LogoMark({
  size = 32,
  className,
  title,
  glow = false,
}: LogoMarkProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradId = `zt-logo-grad-${uid}`;
  const coreId = `zt-logo-core-${uid}`;

  return (
    <svg
      width={size}
      height={(size * 60) / 100}
      viewBox="0 0 100 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      style={glow ? { filter: "drop-shadow(0 0 10px rgba(0,229,255,0.55))" } : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradId} x1="12" y1="10" x2="88" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00e5ff" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id={coreId} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#00e5ff" />
        </radialGradient>
      </defs>

      {/* Infinity loop */}
      <path
        d="M50 30 C 43 12, 16 12, 16 30 C 16 48, 43 48, 50 30 C 57 12, 84 12, 84 30 C 84 48, 57 48, 50 30 Z"
        stroke={`url(#${gradId})`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glowing core node at the crossing */}
      <circle cx="50" cy="30" r="4.4" fill={`url(#${coreId})`} />
    </svg>
  );
}
