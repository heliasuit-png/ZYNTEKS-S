"use client";

import { useState } from "react";
import { CreditCard, ArrowUpRight } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import { Button } from "@/components/dashboard/button";
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
import { manageSubscriptionAction } from "@/features/billing/actions";
import { formatMoney } from "@/utils/billing";
import { ROUTES } from "@/lib/constants";
import type { BillingActionState } from "@/features/billing/types";
import type {
  BillingSubscription,
  SubscriptionStatus,
} from "@/services/billing/types";
import type { LemonCheckoutPlanId } from "@/services/billing/lemon-squeezy/checkout-plans";
import { formatDate } from "@/utils/format";

const statusTone: Record<SubscriptionStatus, BadgeProps["tone"]> = {
  active: "success",
  trialing: "primary",
  past_due: "warning",
  canceled: "danger",
  incomplete: "warning",
  none: "default",
};

/** Next commercial checkout target from local entitlement plan. */
function nextCheckoutPlan(
  plan: BillingSubscription["plan"],
): LemonCheckoutPlanId | null {
  if (plan === "free") return "developer";
  if (plan === "pro") return "business";
  return null;
}

export function SubscriptionPanel({
  subscription,
  checkoutEnabled = false,
}: {
  subscription: BillingSubscription;
  checkoutEnabled?: boolean;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.billingUi;
  const [result, setResult] = useState<BillingActionState>({ status: "idle" });
  const [upgradePending, setUpgradePending] = useState(false);
  const planLabel =
    t.planNames[subscription.plan] ?? subscription.plan;
  const upgradeTarget = nextCheckoutPlan(subscription.plan);

  async function startUpgradeCheckout(plan: LemonCheckoutPlanId) {
    if (!checkoutEnabled) {
      setResult({
        status: "not_configured",
        message: t.paymentProviderNotConnected,
        providerId: "lemonsqueezy",
      });
      return;
    }
    setUpgradePending(true);
    try {
      const res = await fetch("/api/lemonsqueezy/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: { checkoutUrl?: string };
        error?: { message?: string };
      } | null;

      if (res.status === 401) {
        window.location.href = `${ROUTES.login}?redirect=${encodeURIComponent("/billing")}`;
        return;
      }

      const url = json?.data?.checkoutUrl;
      if (!res.ok || !json?.success || !url) {
        setResult({
          status: "error",
          message: json?.error?.message ?? dict.actionMessages.billingFailed,
          providerId: "lemonsqueezy",
        });
        return;
      }
      window.location.assign(url);
    } catch {
      setResult({
        status: "error",
        message: dict.actionMessages.billingFailed,
        providerId: "lemonsqueezy",
      });
    } finally {
      setUpgradePending(false);
    }
  }

  return (
    <FadeIn>
      <Panel>
        <PanelHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PanelTitle>{t.subscriptionTitle}</PanelTitle>
            <PanelDescription>{t.subscriptionDesc}</PanelDescription>
          </div>
          <Badge tone={statusTone[subscription.status]}>
            {subscription.status}
          </Badge>
        </PanelHeader>
        <PanelContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Meta label={t.plan} value={planLabel} />
            <Meta label={t.seats} value={String(subscription.seats)} />
            <Meta
              label={t.amountDue}
              value={formatMoney(
                subscription.amountDueCents,
                subscription.currency,
              )}
            />
            <Meta
              label={t.periodEnds}
              value={
                subscription.currentPeriodEnd
                  ? formatDate(subscription.currentPeriodEnd)
                  : "—"
              }
            />
          </div>

          {subscription.cancelAtPeriodEnd ? (
            <p className="text-sm text-zt-warning">{t.cancellationScheduled}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {upgradeTarget ? (
              <Button
                type="button"
                disabled={upgradePending}
                onClick={() => void startUpgradeCheckout(upgradeTarget)}
              >
                <ArrowUpRight className="size-4" aria-hidden />
                {upgradePending ? t.preparing : t.upgrade}
              </Button>
            ) : null}
            <BillingActionButton
              action={manageSubscriptionAction}
              label={t.manageSubscription}
              pendingLabel={t.preparing}
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
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-zt-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zt-text">{value}</p>
    </div>
  );
}
