import type { Metadata } from "next";

import { APP_NAME } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { MarketingPricingCards } from "@/features/billing/components/marketing-pricing-cards";
import {
  hasAllCheckoutVariants,
  loadCheckoutVariantMapping,
} from "@/services/billing/lemon-squeezy/checkout-plans";
import { isLemonCheckoutUiEnabled } from "@/services/billing/lemon-squeezy/config";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  const p = dict.landing.pricing;
  return {
    title: `${dict.nav.pricing} | ${APP_NAME}`,
    description: p.metaDescription,
    alternates: { canonical: "/pricing" },
    openGraph: {
      title: `${dict.nav.pricing} | ${APP_NAME}`,
      description: p.metaDescription,
      url: "/pricing",
    },
  };
}

export default async function PricingPage() {
  const { dict } = await getDictionary();
  const p = dict.landing.pricing;
  const checkoutEnabled =
    isLemonCheckoutUiEnabled() &&
    hasAllCheckoutVariants(loadCheckoutVariantMapping());

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 overflow-x-hidden px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold tracking-[0.22em] text-zt-primary uppercase">
          {p.eyebrow}
        </p>
        <h1 className="mt-3 text-balance font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight text-zt-text sm:text-5xl">
          {p.pageTitle}
        </h1>
        <p className="mt-4 text-pretty text-base text-zt-muted sm:text-lg">
          {p.pageDesc}
        </p>
      </div>

      <div className="mt-14">
        <MarketingPricingCards
          showPaymentMethods
          checkoutEnabled={checkoutEnabled}
        />
      </div>
    </div>
  );
}
