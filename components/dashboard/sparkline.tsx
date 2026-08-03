"use client";

import { useId } from "react";

export type SparkTone = "primary" | "secondary" | "accent" | "success" | "warning" | "danger" | "muted";

const toneColor: Record<SparkTone, string> = {
  primary: "#3b82f6",
  secondary: "#7c3aed",
  accent: "#00e5ff",
  success: "#00ff88",
  warning: "#ffb020",
  danger: "#ff3b5c",
  muted: "#cbd5e1",
};

/**
 * Ambient decorative sparkline used to give stat cards a premium finish.
 * Purely ornamental (a soft gradient wave) — it does not encode data.
 */
export function Sparkline({
  tone = "primary",
  className,
  points = [10, 8, 12, 7, 13, 9, 15, 11, 16],
}: {
  tone?: SparkTone;
  className?: string;
  points?: number[];
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const color = toneColor[tone];
  const width = 100;
  const height = 32;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / range) * (height - 6) - 3;
    return [x, y] as const;
  });

  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      {coords.length > 0 ? (
        <circle
          cx={coords[coords.length - 1]![0]}
          cy={coords[coords.length - 1]![1]}
          r="2"
          fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      ) : null}
    </svg>
  );
}
