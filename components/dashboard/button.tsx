import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zt-primary/60 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "zt-neon zt-ripple text-white hover:-translate-y-0.5",
        secondary:
          "zt-ripple border border-zt-border bg-white/[0.03] text-zt-text backdrop-blur-sm hover:-translate-y-0.5 hover:border-zt-border-strong hover:bg-white/[0.06] hover:shadow-[0_8px_30px_-12px_rgba(59,130,246,0.5)]",
        ghost:
          "text-zt-muted hover:bg-white/[0.05] hover:text-zt-text",
        danger:
          "zt-ripple border border-zt-danger/40 bg-zt-danger/12 text-zt-danger hover:-translate-y-0.5 hover:bg-zt-danger/20 hover:shadow-[0_8px_30px_-12px_rgba(255,59,92,0.6)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-5 text-[15px]",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
