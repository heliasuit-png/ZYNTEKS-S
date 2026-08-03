import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME, ROUTES } from "@/lib/constants";
import { BILLING_CATALOG, comparePlans } from "@/services/billing/catalog";
import { PricingCards } from "@/features/billing/components/pricing-cards";
import { PlanComparison } from "@/components/billing/plan-comparison";

export const metadata: Metadata = {
  title: `Pricing | ${APP_NAME}`,
  description: "Compare ZYNTEKSIS plans, limits and features.",
};

export default function PricingPage() {
  const comparison = comparePlans();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-zt-primary">Pricing</p>
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-zt-text sm:text-5xl">
          Plans that scale with your product
        </h1>
        <p className="mt-4 text-pretty text-lg text-zt-muted">
          Transparent limits for projects, API keys and AI. Checkout connects
          through a replaceable PaymentProvider — no payment vendor is bundled.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ROUTES.register}
            className="inline-flex h-10 items-center rounded-xl bg-zt-primary px-4 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
          >
            Start free
          </Link>
          <Link
            href={ROUTES.login}
            className="inline-flex h-10 items-center rounded-xl border border-zt-border px-4 text-sm text-zt-muted transition-colors hover:text-zt-text"
          >
            Sign in
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
