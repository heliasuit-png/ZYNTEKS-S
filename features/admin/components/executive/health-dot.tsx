import type { HealthTone } from "@/services/admin/executive-dashboard.types";

const TONE_CLASS: Record<HealthTone, string> = {
  green: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.55)]",
  yellow: "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.45)]",
  red: "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.55)]",
};

export function HealthDot({ tone }: { tone: HealthTone }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${TONE_CLASS[tone]}`}
      aria-hidden
    />
  );
}
