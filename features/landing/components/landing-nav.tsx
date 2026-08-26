"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { APP_NAME, ROUTES } from "@/lib/constants";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LandingNav({
  locale,
  labels,
}: {
  locale: Locale;
  labels: {
    features: string;
    howItWorks: string;
    sdk: string;
    pricing: string;
    faq: string;
    signIn: string;
    startFree: string;
    english: string;
    turkish: string;
    language: string;
  };
}) {
  const links = [
    { href: "#features", label: labels.features },
    { href: "#how-it-works", label: labels.howItWorks },
    { href: "#sdk", label: labels.sdk },
    { href: "#pricing", label: labels.pricing },
    { href: "#faq", label: labels.faq },
  ] as const;

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const switcher = (
    <LanguageSwitcher
      locale={locale}
      labels={{
        english: labels.english,
        turkish: labels.turkish,
        language: labels.language,
      }}
    />
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-zt-border bg-[#04070f]/80 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href={ROUTES.home}
          className="font-[family-name:var(--font-landing-display)] text-lg font-semibold tracking-tight text-zt-text"
        >
          {APP_NAME}
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-zt-muted transition-colors hover:text-zt-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {switcher}
          <Link
            href={ROUTES.login}
            className="text-sm text-zt-muted transition-colors hover:text-zt-text"
          >
            {labels.signIn}
          </Link>
          <Link
            href={ROUTES.register}
            className="inline-flex h-9 items-center rounded-xl bg-zt-primary px-3.5 text-sm font-medium text-[#041018] transition-colors hover:bg-zt-primary/90"
          >
            {labels.startFree}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-zt-border text-zt-text md:hidden"
          aria-expanded={open}
          aria-controls="landing-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div
          id="landing-mobile-nav"
          className="border-t border-zt-border bg-[#070b16]/95 px-5 py-4 backdrop-blur-xl md:hidden"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-2 text-sm text-zt-muted"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="py-2">{switcher}</div>
            <Link
              href={ROUTES.login}
              className="py-2 text-sm text-zt-muted"
              onClick={() => setOpen(false)}
            >
              {labels.signIn}
            </Link>
            <Link
              href={ROUTES.register}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zt-primary text-sm font-medium text-[#041018]"
              onClick={() => setOpen(false)}
            >
              {labels.startFree}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
