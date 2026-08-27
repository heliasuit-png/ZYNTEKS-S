import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME, ROUTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { BILLING_CATALOG, comparePlans } from "@/services/billing/catalog";
import { PricingCards } from "@/features/billing/components/pricing-cards";
import { PlanComparison } from "@/components/billing/plan-comparison";

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
  const comparison = comparePlans();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-zt-primary">{p.eyebrow}</p>
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-zt-text sm:text-5xl">
          {p.pageTitle}
        </h1>
        <p className="mt-4 text-pretty text-lg text-zt-muted">{p.pageDesc}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ROUTES.register}
            className="inline-flex h-10 items-center rounded-xl bg-zt-primary px-4 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
          >
            {p.startFree}
          </Link>
          <Link
            href={ROUTES.login}
            className="inline-flex h-10 items-center rounded-xl border border-zt-border px-4 text-sm text-zt-muted transition-colors hover:text-zt-text"
          >
            {dict.common.signIn}
          </Link>
        </div>
      </div>

      <div className="mt-14">
        <PricingCards plans={BILLING_CATALOG} mode="marketing" />
      </div>

      <div className="mt-14">
        <PlanComparison comparison={comparison} />
      </div>
    </div>
  );
}
