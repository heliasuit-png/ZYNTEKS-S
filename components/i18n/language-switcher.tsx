"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setLocaleAction } from "@/features/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  labels,
  className,
}: {
  locale: Locale;
  labels: { english: string; turkish: string; language: string };
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role="group"
      aria-label={labels.language}
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        const label = code === "en" ? labels.english : labels.turkish;
        return (
          <button
            key={code}
            type="button"
            disabled={pending}
            onClick={() => onChange(code)}
            className={cn(
              "rounded-lg px-2 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-zt-primary/20 text-zt-text"
                : "text-zt-muted hover:text-zt-text",
              pending && "opacity-60",
            )}
            aria-pressed={active}
          >
            {code === "en" ? "EN" : "TR"}
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
