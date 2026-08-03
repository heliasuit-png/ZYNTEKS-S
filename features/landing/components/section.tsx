import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function LandingSection({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  narrow,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn("relative px-5 py-20 sm:px-8 sm:py-24 lg:py-28", className)}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className={cn("mx-auto", narrow ? "max-w-3xl" : "max-w-6xl")}>
        <div className={cn("mb-12 max-w-2xl", narrow && "mx-auto text-center")}>
          {eyebrow ? (
            <p className="mb-3 font-[family-name:var(--font-landing-display)] text-sm font-semibold tracking-[0.18em] text-zt-primary uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={id ? `${id}-title` : undefined}
            className="font-[family-name:var(--font-landing-display)] text-3xl font-semibold tracking-tight text-zt-text sm:text-4xl"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-zt-muted sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
