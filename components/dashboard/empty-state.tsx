import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo-mark";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Premium, reusable empty state shown when a section has no data yet. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-dashed border-zt-border bg-white/[0.015] px-6 py-12 text-center",
        className,
      )}
    >
      {/* Soft ambient glow behind the illustration. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-6 size-40 -translate-x-1/2 rounded-full bg-zt-primary/10 blur-3xl"
      />
      {/* Faint brand watermark. */}
      <LogoMark
        size={150}
        className="pointer-events-none absolute -bottom-8 -right-6 opacity-[0.04]"
      />
      <span className="zt-float relative flex size-16 items-center justify-center rounded-2xl border border-zt-border bg-gradient-to-br from-white/[0.06] to-transparent text-zt-primary shadow-lg shadow-black/30">
        <Icon className="size-7" aria-hidden />
      </span>
      <div className="relative space-y-1.5">
        <p className="text-base font-semibold text-zt-text">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-zt-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="relative mt-1">{action}</div> : null}
    </div>
  );
}
