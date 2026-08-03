"use client";

import { useId, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/utils";

const INFINITY_PATH =
  "M50 30 C 43 12, 16 12, 16 30 C 16 48, 43 48, 50 30 C 57 12, 84 12, 84 30 C 84 48, 57 48, 50 30 Z";

/**
 * The AI Core — a large animated infinity symbol.
 *
 * Energy flows continuously around the loop, an ambient aura breathes, particles
 * orbit the crossing point and the whole core tilts subtly toward the pointer.
 * GPU-friendly transforms only; ambient motion is suppressed under
 * `prefers-reduced-motion`.
 */
export function AiInfinity({
  size = 260,
  className,
  interactive = true,
}: {
  size?: number;
  className?: string;
  interactive?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradId = `zt-inf-${uid}`;
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [12, -12]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-12, 12]), {
    stiffness: 150,
    damping: 18,
  });

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function reset() {
    px.set(0);
    py.set(0);
  }

  const height = size * 0.6;

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        width: size,
        height,
      }}
      className={cn("relative flex items-center justify-center", className)}
      aria-hidden
    >
      {/* Ambient aura */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-zt-primary/45 via-zt-secondary/30 to-zt-purple/30 blur-3xl"
        style={{ width: size * 0.9, height: height * 1.4 }}
        animate={reduce ? undefined : { scale: [1, 1.14, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Energy waves */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-zt-accent/30"
          style={{ width: size * 0.34, height: size * 0.34 }}
          animate={reduce ? undefined : { scale: [1, 2.4], opacity: [0.5, 0] }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 1.1,
          }}
        />
      ))}

      {/* Infinity glyph */}
      <svg
        viewBox="0 0 100 60"
        width={size}
        height={height}
        fill="none"
        className="relative"
        style={{ filter: "drop-shadow(0 0 18px rgba(0,229,255,0.55))" }}
      >
        <defs>
          <linearGradient id={gradId} x1="12" y1="10" x2="88" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00e5ff" />
            <stop offset="0.5" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
        </defs>

        {/* Base loop */}
        <path
          d={INFINITY_PATH}
          stroke={`url(#${gradId})`}
          strokeOpacity="0.28"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Flowing energy pulse */}
        <motion.path
          d={INFINITY_PATH}
          stroke={`url(#${gradId})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="0.28 0.72"
          animate={reduce ? undefined : { strokeDashoffset: [1, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
        />
      </svg>

      {/* Breathing core node */}
      <motion.span
        className="absolute rounded-full bg-white"
        style={{
          width: size * 0.05,
          height: size * 0.05,
          boxShadow: "0 0 22px 4px rgba(0,229,255,0.85)",
        }}
        animate={reduce ? undefined : { scale: [1, 1.35, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orbiting particles */}
      {[
        [size * 0.6, 8, 1, "var(--color-zt-accent)"],
        [size * 0.44, 6, -1, "var(--color-zt-purple)"],
      ].map(([orbit, duration, dir, color], i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ width: orbit as number, height: orbit as number }}
          animate={reduce ? undefined : { rotate: 360 * (dir as number) }}
          transition={{ duration: duration as number, repeat: Infinity, ease: "linear" }}
        >
          <span
            className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full"
            style={{
              backgroundColor: color as string,
              boxShadow: `0 0 10px ${color as string}`,
            }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
