import Link from "next/link";

import { DASHBOARD_ROUTES, ROUTES } from "@/lib/constants";
import { comparePlans } from "@/services/billing/catalog";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";

export function LandingPricing() {
  const comparison = comparePlans();

  return (
    <LandingSection
      id="pricing"
      eyebrow="Pricing"
      title="Clear plans. Local limits. Pluggable billing."
      description="Compare plan limits and features. Purchase and upgrade flows open the billing placeholders — no payment vendor is bundled."
    >
      <Reveal>
        <PlanComparison comparison={comparison} />
      </Reveal>
      <Reveal delay={0.08}>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ROUTES.register}
            className="inline-flex h-11 items-center rounded-xl bg-zt-primary px-5 text-sm font-semibold text-[#041018] transition-colors hover:bg-zt-primary/90"
          >
            Start free
          </Link>
          <Link
            href={DASHBOARD_ROUTES.billing}
            className="inline-flex h-11 items-center rounded-xl border border-zt-border px-5 text-sm font-medium text-zt-text transition-colors hover:border-zt-border-strong"
          >
            Open billing placeholders
          </Link>
          <Link
            href={ROUTES.pricing}
            className="inline-flex h-11 items-center rounded-xl px-3 text-sm text-zt-muted transition-colors hover:text-zt-text"
          >
            Full pricing page
          </Link>
        </div>
      </Reveal>
    </LandingSection>
  );
}
