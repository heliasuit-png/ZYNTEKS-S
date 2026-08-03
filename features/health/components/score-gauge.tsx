"use client";

import { CircularProgress } from "@/components/dashboard/circular-progress";
import { CountUp, FadeIn } from "@/components/dashboard/motion";

function colorsFor(value: number): { from: string; to: string } {
  if (value >= 90) return { from: "#00ff88", to: "#00e5ff" };
  if (value >= 70) return { from: "#ffb020", to: "#3b82f6" };
  return { from: "#ff3b5c", to: "#ffb020" };
}

interface ScoreGaugeProps {
  label: string;
  value: number;
  delay?: number;
  size?: number;
}

export function ScoreGauge({
  label,
  value,
  delay = 0,
  size = 112,
}: ScoreGaugeProps) {
  const colors = colorsFor(value);
  return (
    <FadeIn delay={delay} className="flex flex-col items-center gap-2">
      <CircularProgress
        value={value}
        size={size}
        strokeWidth={10}
        from={colors.from}
        to={colors.to}
      >
        <span className="text-xl font-semibold tabular-nums text-zt-text">
          <CountUp value={value} />
        </span>
      </CircularProgress>
      <span className="text-center text-xs font-medium text-zt-muted">
        {label}
      </span>
    </FadeIn>
  );
}
