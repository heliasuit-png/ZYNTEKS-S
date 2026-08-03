"use client";

import { useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { BillingSettings } from "@/features/billing/components/billing-settings";
import { InvoiceHistory } from "@/features/billing/components/invoice-history";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { PricingCards } from "@/features/billing/components/pricing-cards";
import { SubscriptionPanel } from "@/features/billing/components/subscription-panel";
import { UsageDashboard } from "@/features/billing/components/usage-dashboard";
import type { comparePlans } from "@/services/billing/catalog";
import type { BillingOverview, PlanDefinition } from "@/services/billing/types";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "plans", label: "Plans" },
  { id: "usage", label: "Usage" },
  { id: "invoices", label: "Invoices" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function BillingDashboard({
  overview,
  catalog,
  comparison,
}: {
  overview: BillingOverview;
  catalog: readonly PlanDefinition[];
  comparison: ReturnType<typeof comparePlans>;
}) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Subscription, usage, plan comparison and invoice history. Payment checkout is provider-pluggable."
      />

      <div
        className="flex flex-wrap gap-2 border-b border-zt-border pb-3"
        role="tablist"
        aria-label="Billing sections"
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
          <SubscriptionPanel subscription={overview.subscription} />
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
