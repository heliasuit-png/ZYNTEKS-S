import type { ReactNode } from "react";

import { APP_NAME } from "@/lib/constants";
import { LogoMark } from "@/components/brand/logo-mark";
import { FadeIn } from "@/components/dashboard/motion";

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Premium glass wrapper shared by every authentication page. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <FadeIn>
      <div className="zt-card zt-gradient-border relative overflow-hidden rounded-3xl p-8">
        {/* Ambient brand glow */}
        <div
          aria-hidden
          className="zt-glow-pulse pointer-events-none absolute left-1/2 top-0 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-zt-primary/25 via-zt-secondary/15 to-transparent blur-3xl"
        />

        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl border border-zt-border bg-white/[0.03] shadow-lg shadow-zt-primary/25">
            <LogoMark size={40} glow />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-zt-muted">
            {APP_NAME}
          </span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-zt-accent via-white to-zt-secondary bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
          {description ? (
            <p className="mt-1.5 text-sm text-zt-muted">{description}</p>
          ) : null}
        </div>

        <div className="relative mt-6 space-y-4 text-left">{children}</div>

        {footer ? (
          <div className="relative mt-6 border-t border-zt-border pt-4 text-center text-sm text-zt-muted">
            {footer}
          </div>
        ) : null}
      </div>
    </FadeIn>
  );
}
