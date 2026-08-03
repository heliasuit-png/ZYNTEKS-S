"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CircularProgressProps {
  /** Percentage 0–100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  from?: string;
  to?: string;
  /** Render a soft pulsing glow halo behind the ring. */
  glow?: boolean;
  children?: ReactNode;
}

export function CircularProgress({
  value,
  size = 140,
  strokeWidth = 12,
  from = "#00e5ff",
  to = "#7c3aed",
  glow = true,
  children,
}: CircularProgressProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(clamped)} percent`}
    >
      {glow ? (
        <div
          aria-hidden
          className="zt-glow-pulse pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${to}55, transparent 68%)`,
            filter: "blur(10px)",
          }}
        />
      ) : null}
      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id={`ring-${rawId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${rawId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${to}aa)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
