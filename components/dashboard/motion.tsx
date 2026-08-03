"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

/** Simple entrance animation used across dashboard sections. */
export function FadeIn({ children, className, delay = 0, y = 8 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode[];
  className?: string;
  step?: number;
}

/** Renders children with an incremental entrance delay. */
export function Stagger({ children, className, step = 0.05 }: StaggerProps) {
  return (
    <>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * step} className={className}>
          {child}
        </FadeIn>
      ))}
    </>
  );
}

interface CountUpProps {
  value: number;
  className?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

/** Animated number that counts up on mount. Honors prefers-reduced-motion. */
export function CountUp({
  value,
  className,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.1,
}: CountUpProps) {
  const mv = useMotionValue(0);
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const text = useTransform(
    mv,
    (v) => `${prefix}${formatter.format(v)}${suffix}`,
  );

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, duration, mv]);

  return <motion.span className={className}>{text}</motion.span>;
}
