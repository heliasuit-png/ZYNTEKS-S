import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      tone: {
        default: "border-zt-border bg-zt-surface-2 text-zt-muted",
        primary: "border-zt-primary/30 bg-zt-primary/15 text-zt-primary",
        success: "border-zt-success/30 bg-zt-success/15 text-zt-success",
        warning: "border-zt-warning/30 bg-zt-warning/15 text-zt-warning",
        danger: "border-zt-danger/30 bg-zt-danger/15 text-zt-danger",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
