"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "warning" | "error" | "info";

const variantMeta: Record<
  ToastVariant,
  { icon: LucideIcon; iconWrap: string; bar: string }
> = {
  success: {
    icon: CheckCircle2,
    iconWrap: "bg-zt-success/15 text-zt-success",
    bar: "from-zt-success to-zt-accent",
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: "bg-zt-warning/15 text-zt-warning",
    bar: "from-zt-warning to-zt-primary",
  },
  error: {
    icon: XCircle,
    iconWrap: "bg-zt-danger/15 text-zt-danger",
    bar: "from-zt-danger to-zt-warning",
  },
  info: {
    icon: Info,
    iconWrap: "bg-zt-primary/15 text-zt-primary",
    bar: "from-zt-primary to-zt-secondary",
  },
};

/**
 * Premium, self-dismissing toast: slides in from the right with a depleting
 * progress indicator. Backwards compatible — `message`, `onDismiss` and
 * `duration` behave as before; `variant` and `title` are optional.
 */
export function Toast({
  message,
  onDismiss,
  duration = 3500,
  variant = "success",
  title,
}: {
  message: string;
  onDismiss: () => void;
  duration?: number;
  variant?: ToastVariant;
  title?: string;
}) {
  const [open, setOpen] = useState(true);
  const meta = variantMeta[variant];
  const Icon = meta.icon;

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {open ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.96 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="zt-glass-strong fixed bottom-4 right-4 z-[70] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zt-border shadow-2xl shadow-black/50"
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                meta.iconWrap,
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              {title ? (
                <p className="text-sm font-semibold text-zt-text">{title}</p>
              ) : null}
              <p className="text-sm text-zt-text/90">{message}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Dismiss notification"
              className="rounded-md text-zt-muted transition-colors hover:text-zt-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zt-primary/50"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <motion.div
            className={cn("h-0.5 origin-left bg-gradient-to-r", meta.bar)}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
