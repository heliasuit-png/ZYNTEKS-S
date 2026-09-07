"use client";

import { useState } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { BillingSettings } from "@/features/billing/components/billing-settings";
import { InvoiceHistory } from "@/features/billing/components/invoice-history";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { PricingCards } from "@/features/billing/components/pricing-cards";
import { SubscriptionPanel } from "@/features/billing/components/subscription-panel";
import { UsageDashboard } from "@/features/billing/components/usage-dashboard";
import type { comparePlans } from "@/services/billing/catalog";
import type { BillingOverview, PlanDefinition } from "@/services/billing/types";

type TabId = "overview" | "plans" | "usage" | "invoices" | "settings";

export function BillingDashboard({
  overview,
  catalog,
  comparison,
  checkoutNotice,
  checkoutEnabled = false,
}: {
  overview: BillingOverview;
  catalog: readonly PlanDefinition[];
  comparison: ReturnType<typeof comparePlans>;
  checkoutNotice?: string | null;
  checkoutEnabled?: boolean;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.billingUi;
  const [tab, setTab] = useState<TabId>("overview");

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: t.overview },
    { id: "plans", label: t.plans },
    { id: "usage", label: t.usage },
    { id: "invoices", label: t.invoices },
    { id: "settings", label: t.settings },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t.pageTitle} description={t.pageDesc} />

      {checkoutNotice ? (
        <p
          role="status"
          className="rounded-xl border border-zt-border bg-zt-surface-2 px-4 py-3 text-sm text-zt-muted"
        >
          {checkoutNotice}
        </p>
      ) : null}

      <div
        className="flex flex-wrap gap-2 border-b border-zt-border pb-3"
        role="tablist"
        aria-label={t.sectionsAria}
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              tab === item.id
                ? "bg-zt-primary/15 text-zt-primary"
                : "text-zt-muted hover:text-zt-text"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-6">
          <SubscriptionPanel
            subscription={overview.subscription}
            checkoutEnabled={checkoutEnabled}
          />
          <UsageDashboard usage={overview.usage} />
          <InvoiceHistory invoices={overview.invoices} />
        </div>
      ) : null}

      {tab === "plans" ? (
        <div className="space-y-6">
          <PricingCards
            plans={catalog}
            currentPlan={overview.subscription.plan}
            authenticated
            mode="dashboard"
            checkoutEnabled={checkoutEnabled}
          />
          <PlanComparison comparison={comparison} />
        </div>
      ) : null}

      {tab === "usage" ? <UsageDashboard usage={overview.usage} /> : null}

      {tab === "invoices" ? (
        <InvoiceHistory invoices={overview.invoices} />
      ) : null}

      {tab === "settings" ? (
        <BillingSettings
          providerId={overview.providerId}
          providerDisplayName={overview.providerDisplayName}
          providerConfigured={overview.providerConfigured}
        />
      ) : null}
    </div>
  );
}
