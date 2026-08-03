import { Manrope, Syne } from "next/font/google";
import type { ReactNode } from "react";

import { LandingBackground } from "@/features/landing/components/landing-background";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingNav } from "@/features/landing/components/landing-nav";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-landing-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-landing-body",
  display: "swap",
});

export default function MarketingLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div
      className={`${display.variable} ${body.variable} relative flex min-h-screen flex-col font-[family-name:var(--font-landing-body)] text-zt-text`}
    >
      <LandingBackground />
      <LandingNav />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
