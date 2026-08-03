import type { ReactNode } from "react";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:px-8">
      <h1 className="font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight text-zt-text">
        {title}
      </h1>
      <div className="prose-invert mt-8 space-y-4 text-sm leading-relaxed text-zt-muted sm:text-base">
        {children}
      </div>
    </article>
  );
}
