"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { APP_NAME, DASHBOARD_ROUTES, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#sdk", label: "SDK" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingNav() {
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
          {LINKS.map((link) => (
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
          <Link
            href={ROUTES.login}
            className="text-sm text-zt-muted transition-colors hover:text-zt-text"
          >
            Sign in
          </Link>
          <Link
            href={ROUTES.register}
            className="inline-flex h-9 items-center rounded-xl bg-zt-primary px-3.5 text-sm font-medium text-[#041018] transition-colors hover:bg-zt-primary/90"
          >
            Start free
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
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-2 text-sm text-zt-muted"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href={ROUTES.login}
              className="py-2 text-sm text-zt-muted"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href={ROUTES.register}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zt-primary text-sm font-medium text-[#041018]"
              onClick={() => setOpen(false)}
            >
              Start free
            </Link>
            <Link
              href={DASHBOARD_ROUTES.billing}
              className="py-2 text-sm text-zt-muted"
              onClick={() => setOpen(false)}
            >
              Billing
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
