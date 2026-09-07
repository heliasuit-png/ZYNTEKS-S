"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/dashboard/badge";
import { FadeIn } from "@/components/dashboard/motion";
import { Button } from "@/components/dashboard/button";
import {
  BillingActionMessage,
} from "@/features/billing/components/billing-action-button";
import { formatLimit, formatMoney } from "@/utils/billing";
import { ROUTES } from "@/lib/constants";
import {
  isLemonCheckoutPlanId,
  type LemonCheckoutPlanId,
} from "@/services/billing/lemon-squeezy/checkout-plans";
import { commercialPlanFromEntitlement } from "@/services/billing/catalog";
import type { BillingActionState } from "@/features/billing/types";
import type {
  BillingPlanId,
  CommercialPlanId,
  PlanDefinition,
} from "@/services/billing/types";

export function PricingCards({
  plans,
  currentPlan,
  authenticated,
  mode = "marketing",
  checkoutEnabled = false,
}: {
  plans: readonly PlanDefinition[];
  /** Local entitlement plan of record (free | pro | enterprise). */
  currentPlan?: BillingPlanId;
  authenticated?: boolean;
  mode?: "marketing" | "dashboard";
  /** Server-resolved TEST MODE + variants — enables Lemon checkout CTAs. */
  checkoutEnabled?: boolean;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.billingUi;
  const [result, setResult] = useState<BillingActionState>({ status: "idle" });
  const currentCommercial = currentPlan
    ? commercialPlanFromEntitlement(currentPlan)
    : undefined;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan, index) => {
          const price =
            plan.prices.find((p) => p.interval === "month") ?? plan.prices[0]!;
          const isCurrent = currentCommercial === plan.id;
          const copy = t.catalog[plan.id];
          return (
            <FadeIn key={plan.id} delay={index * 0.04}>
              <article
                className={`flex h-full flex-col rounded-2xl border p-6 ${
                  plan.highlighted
                    ? "border-zt-primary/50 bg-zt-primary/5 shadow-[0_0_40px_-20px_var(--color-zt-primary)]"
                    : "border-zt-border bg-zt-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-zt-text">
                      {copy.name}
                    </h3>
                    <p className="mt-1 text-sm text-zt-muted">
                      {copy.description}
                    </p>
                  </div>
                  {plan.highlighted ? (
                    <Badge tone="primary">{t.popular}</Badge>
                  ) : null}
                  {isCurrent ? <Badge tone="success">{t.current}</Badge> : null}
                </div>

                <p className="mt-6 text-3xl font-semibold text-zt-text">
                  {formatMoney(price.amountCents, price.currency)}
                  <span className="text-sm font-normal text-zt-muted">
                    {t.perMonth}
                  </span>
                </p>

                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  <li className="text-zt-muted">
                    {t.limitProjects.replace(
                      "{count}",
                      formatLimit(plan.limits.projects, t.unlimited),
                    )}
                  </li>
                  <li className="text-zt-muted">
                    {t.limitApiKeys.replace(
                      "{count}",
                      formatLimit(plan.limits.apiKeysPerProject, t.unlimited),
                    )}
                  </li>
                  <li className="text-zt-muted">
                    {t.limitAiMessages.replace(
                      "{count}",
                      formatLimit(plan.limits.aiMessagesPerMonth, t.unlimited),
                    )}
                  </li>
                  {plan.features
                    .filter((f) => f.id === "priority" || f.id === "sso")
                    .map((feature) => (
                      <li
                        key={feature.id}
                        className="flex items-center gap-2 text-zt-muted"
                      >
                        {feature.included ? (
                          <Check className="size-4 text-zt-success" aria-hidden />
                        ) : (
                          <Minus className="size-4 text-zt-muted" aria-hidden />
                        )}
                        {
                          t.catalog.features[
                            feature.id as keyof typeof t.catalog.features
                          ]
                        }
                      </li>
                    ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <p className="rounded-xl border border-zt-border px-3 py-2 text-center text-sm text-zt-muted">
                      {t.yourCurrentPlan}
                    </p>
                  ) : mode === "marketing" && !authenticated ? (
                    <a
                      href={
                        plan.id === "free"
                          ? ROUTES.register
                          : `/register?plan=${plan.id}`
                      }
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-zt-primary text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
                    >
                      {plan.id === "free" ? t.getStarted : t.purchase}
                    </a>
                  ) : plan.id === "free" ? (
                    <p className="rounded-xl border border-zt-border px-3 py-2 text-center text-sm text-zt-muted">
                      {t.getStarted}
                    </p>
                  ) : (
                    <CommercialCheckoutButton
                      planId={plan.id}
                      label={t.purchase}
                      pendingLabel={t.preparing}
                      checkoutEnabled={checkoutEnabled}
                      onResult={setResult}
                    />
                  )}
                </div>
              </article>
            </FadeIn>
          );
        })}
      </div>

      <BillingActionMessage state={result} />
    </div>
  );
}

function CommercialCheckoutButton({
  planId,
  label,
  pendingLabel,
  checkoutEnabled,
  onResult,
}: {
  planId: CommercialPlanId;
  label: string;
  pendingLabel: string;
  checkoutEnabled: boolean;
  onResult: (state: BillingActionState) => void;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.billingUi;
  const [pending, setPending] = useState(false);

  async function startCheckout() {
    if (!isLemonCheckoutPlanId(planId)) return;
    if (!checkoutEnabled) {
      onResult({
        status: "not_configured",
        message: t.paymentProviderNotConnected,
        providerId: "lemonsqueezy",
      });
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/lemonsqueezy/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId as LemonCheckoutPlanId }),
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
        onResult({
          status: "error",
          message:
            json?.error?.message ??
            dict.actionMessages.billingFailed,
          providerId: "lemonsqueezy",
        });
        return;
      }

      window.location.assign(url);
    } catch {
      onResult({
        status: "error",
        message: dict.actionMessages.billingFailed,
        providerId: "lemonsqueezy",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      className="w-full"
      disabled={pending}
      onClick={() => void startCheckout()}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
