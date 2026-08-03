"use client";

import { useState } from "react";
import { CreditCard, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import {
  BillingActionButton,
  BillingActionMessage,
} from "@/features/billing/components/billing-action-button";
import {
  manageSubscriptionAction,
  upgradePlanAction,
} from "@/features/billing/actions";
import { formatMoney } from "@/utils/billing";
import type { BillingActionState } from "@/features/billing/types";
import type {
  BillingSubscription,
  SubscriptionStatus,
} from "@/services/billing/types";
import { formatDate } from "@/utils/format";

const statusTone: Record<SubscriptionStatus, BadgeProps["tone"]> = {
  active: "success",
  trialing: "primary",
  past_due: "warning",
  canceled: "danger",
  incomplete: "warning",
  none: "default",
};

export function SubscriptionPanel({
  subscription,
}: {
  subscription: BillingSubscription;
}) {
  const [result, setResult] = useState<BillingActionState>({ status: "idle" });
  const canUpgrade = subscription.plan === "free" || subscription.plan === "pro";

  return (
    <FadeIn>
      <Panel>
        <PanelHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PanelTitle>Subscription</PanelTitle>
            <PanelDescription>
              Current plan status and billing cycle. Checkout opens only after a
              PaymentProvider is connected.
            </PanelDescription>
          </div>
          <Badge tone={statusTone[subscription.status]}>
            {subscription.status}
          </Badge>
        </PanelHeader>
        <PanelContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Meta label="Plan" value={subscription.plan} capitalize />
            <Meta label="Seats" value={String(subscription.seats)} />
            <Meta
              label="Amount due"
              value={formatMoney(
                subscription.amountDueCents,
                subscription.currency,
              )}
            />
            <Meta
              label="Period ends"
              value={
                subscription.currentPeriodEnd
                  ? formatDate(subscription.currentPeriodEnd)
                  : "—"
              }
            />
          </div>

          {subscription.cancelAtPeriodEnd ? (
            <p className="text-sm text-zt-warning">
              Cancellation is scheduled at period end.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {canUpgrade ? (
              <BillingActionButton
                action={upgradePlanAction}
                label="Upgrade"
                pendingLabel="Preparing…"
                hiddenFields={{
                  fromPlan: subscription.plan,
                  toPlan: subscription.plan === "free" ? "pro" : "enterprise",
                  interval: subscription.interval ?? "month",
                }}
                onResult={setResult}
              >
                <ArrowUpRight className="size-4" aria-hidden />
              </BillingActionButton>
            ) : null}
            <BillingActionButton
              action={manageSubscriptionAction}
              label="Manage subscription"
              pendingLabel="Preparing…"
              variant="secondary"
              onResult={setResult}
            >
              <CreditCard className="size-4" aria-hidden />
            </BillingActionButton>
          </div>

          <BillingActionMessage state={result} />
        </PanelContent>
      </Panel>
    </FadeIn>
  );
}

function Meta({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-zt-muted">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold text-zt-text ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
