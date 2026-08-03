"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Interactive floating AI orb — the visual heart of the dashboard.
 *
 * A breathing, glowing sphere wrapped in energy waves, orbiting particles,
 * rotating light rays and a conic halo. It gently tilts toward the pointer.
 * Everything is GPU-friendly (transform/opacity only) and all ambient motion
 * is suppressed under `prefers-reduced-motion`.
 */
export function AiOrb({
  className,
  size = 160,
  interactive = true,
}: {
  className?: string;
  size?: number;
  interactive?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [14, -14]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), {
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

  const core = size * 0.52;
  const ring = size * 0.82;
  const glow = size * 1.2;
  const iconSize = Math.round(core * 0.4);

  // Orbiting particles: [orbit diameter, duration seconds, direction, color].
  const particles: Array<[number, number, 1 | -1, string]> = [
    [size * 0.98, 9, 1, "var(--color-zt-accent)"],
    [size * 0.78, 7, -1, "var(--color-zt-secondary)"],
    [size * 1.08, 13, 1, "var(--color-zt-ai)"],
  ];

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
        height: size,
      }}
      className={cn("relative flex items-center justify-center", className)}
      aria-hidden
    >
      {/* Ambient outer glow */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-zt-primary/45 via-zt-secondary/35 to-zt-accent/25 blur-3xl"
        style={{ width: glow, height: glow }}
        animate={reduce ? undefined : { scale: [1, 1.16, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rotating light rays */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          background:
            "repeating-conic-gradient(from 0deg, rgba(0,229,255,0.16) 0deg 3deg, transparent 3deg 18deg)",
          maskImage:
            "radial-gradient(circle, transparent 42%, #000 55%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 42%, #000 55%, transparent 78%)",
        }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      {/* Energy waves radiating from the core */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-zt-accent/40"
          style={{ width: core, height: core }}
          animate={
            reduce ? undefined : { scale: [1, 2.3], opacity: [0.55, 0] }
          }
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 1.05,
          }}
        />
      ))}

      {/* Conic halo ring */}
      <motion.div
        className="absolute rounded-full opacity-70"
        style={{
          width: ring,
          height: ring,
          background:
            "conic-gradient(from 0deg, transparent, #00e5ff, transparent 40%, #00ffd1, transparent 70%, #7c3aed, transparent)",
          maskImage: "radial-gradient(circle, transparent 60%, #000 62%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 60%, #000 62%)",
        }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />

      {/* Core sphere with reflection */}
      <motion.div
        className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-zt-accent via-zt-primary to-zt-secondary"
        style={{
          width: core,
          height: core,
          boxShadow:
            "0 0 60px -6px rgba(0,229,255,0.7), 0 0 120px -20px rgba(124,58,237,0.6)",
        }}
        animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-t from-black/30 to-transparent" />
        <span
          className="absolute rounded-full bg-white/45 blur-md"
          style={{ width: core * 0.24, height: core * 0.24, left: core * 0.18, top: core * 0.16 }}
        />
        <motion.span
          animate={reduce ? undefined : { rotate: [0, 8, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles
            className="relative text-white drop-shadow"
            style={{ width: iconSize, height: iconSize }}
            aria-hidden
          />
        </motion.span>
      </motion.div>

      {/* Orbiting particles */}
      {particles.map(([orbit, duration, dir, color], i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ width: orbit, height: orbit }}
          animate={reduce ? undefined : { rotate: 360 * dir }}
          transition={{ duration, repeat: Infinity, ease: "linear" }}
        >
          <span
            className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
