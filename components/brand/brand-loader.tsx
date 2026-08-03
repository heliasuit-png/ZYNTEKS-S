"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { APP_NAME } from "@/lib/constants";
import { LogoMark } from "@/components/brand/logo-mark";

/**
 * Animated brand intro used for full-screen loading states: a rotating,
 * glowing infinity logo with expanding energy rings, a smooth progress bar
 * and an "Initializing…" percentage. All motion respects reduced-motion.
 */
export function BrandLoader({
  label = `Initializing ${APP_NAME}`,
}: {
  label?: string;
}) {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return Math.min(100, p + Math.max(1.2, (100 - p) * 0.09));
      });
    }, 90);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-7"
    >
      <div className="relative flex items-center justify-center">
        {/* Energy rings */}
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            className="absolute size-24 rounded-full border border-zt-accent/40"
            animate={reduce ? undefined : { scale: [1, 2.1], opacity: [0.5, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 1.2,
            }}
          />
        ))}

        {/* Ambient glow */}
        <motion.span
          aria-hidden
          className="absolute size-28 rounded-full bg-gradient-to-br from-zt-primary/50 via-zt-secondary/40 to-zt-purple/30 blur-2xl"
          animate={reduce ? undefined : { opacity: [0.4, 0.85, 0.4], scale: [1, 1.14, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Rotating, breathing infinity logo */}
        <motion.div
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <LogoMark size={92} glow />
          </motion.div>
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="bg-gradient-to-r from-zt-accent via-white to-zt-purple bg-clip-text text-lg font-semibold tracking-tight text-transparent">
          {label}
          <span className="text-zt-muted">…</span>
        </span>

        {/* Progress bar */}
        <div className="relative h-1.5 w-56 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-zt-accent via-zt-secondary to-zt-purple"
            style={{ boxShadow: "0 0 14px -2px var(--color-zt-primary)" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.2 }}
          />
        </div>
        <span className="text-xs font-medium tabular-nums text-zt-muted">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
