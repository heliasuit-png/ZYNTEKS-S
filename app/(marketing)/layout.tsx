import { Manrope, Syne } from "next/font/google";
import type { ReactNode } from "react";

import { LocaleProvider } from "@/components/i18n/locale-provider";
import { LandingBackground } from "@/features/landing/components/landing-background";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingNav } from "@/features/landing/components/landing-nav";
import { getDictionary } from "@/lib/i18n/get-dictionary";

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

export default async function MarketingLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { locale, dict } = await getDictionary();

  return (
    <LocaleProvider locale={locale} dict={dict}>
      <div
        className={`${display.variable} ${body.variable} relative flex min-h-screen flex-col font-[family-name:var(--font-landing-body)] text-zt-text`}
      >
        <LandingBackground />
        <LandingNav
          locale={locale}
          labels={{
            features: dict.nav.features,
            howItWorks: dict.nav.howItWorks,
            sdk: dict.nav.sdk,
            pricing: dict.nav.pricing,
            faq: dict.nav.faq,
            signIn: dict.common.signIn,
            startFree: dict.common.startFree,
            english: dict.common.english,
            turkish: dict.common.turkish,
            language: dict.common.language,
          }}
        />
        <main className="flex-1">{children}</main>
        <LandingFooter />
      </div>
    </LocaleProvider>
  );
}
