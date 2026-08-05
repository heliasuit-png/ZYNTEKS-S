"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  delay?: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 70, damping: 18 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString(),
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export function MetricCard({ label, value, hint, delay = 0 }: MetricCardProps) {
  const numeric = Number(value.replace(/,/g, ""));
  const isNumeric = Number.isFinite(numeric) && /^\d[\d,]*$/.test(value.trim());

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: "easeOut" }}
      className="admin-glass relative overflow-hidden rounded-2xl p-4"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(59,130,246,0.55)] to-transparent"
      />
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--admin-text)]">
        {isNumeric ? <AnimatedNumber value={numeric} /> : value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--admin-muted)]">{hint}</p>
      ) : null}
    </motion.article>
  );
}
