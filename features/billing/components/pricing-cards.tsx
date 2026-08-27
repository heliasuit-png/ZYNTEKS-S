"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/dashboard/badge";
import { FadeIn } from "@/components/dashboard/motion";
import {
  BillingActionButton,
  BillingActionMessage,
} from "@/features/billing/components/billing-action-button";
import {
  changePlanAction,
  purchasePlanAction,
  upgradePlanAction,
} from "@/features/billing/actions";
import { formatLimit, formatMoney } from "@/utils/billing";
import type { BillingActionState } from "@/features/billing/types";
import type { BillingPlanId, PlanDefinition } from "@/services/billing/types";

export function PricingCards({
  plans,
  currentPlan,
  authenticated,
  mode = "marketing",
}: {
  plans: readonly PlanDefinition[];
  currentPlan?: BillingPlanId;
  authenticated?: boolean;
  mode?: "marketing" | "dashboard";
}) {
  const { dict } = useDictionary();
  const t = dict.dash.billingUi;
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [result, setResult] = useState<BillingActionState>({ status: "idle" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <IntervalToggle interval={interval} onChange={setInterval} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan, index) => {
          const price =
            plan.prices.find((p) => p.interval === interval) ?? plan.prices[0]!;
          const isCurrent = currentPlan === plan.id;
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
                      {t.catalog[plan.id].name}
                    </h3>
                    <p className="mt-1 text-sm text-zt-muted">
                      {t.catalog[plan.id].description}
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
                    {interval === "year" ? t.perYear : t.perMonth}
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
                        plan.id === "enterprise"
                          ? "/contact"
                          : `/register?plan=${plan.id}`
                      }
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-zt-primary text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
                    >
                      {plan.id === "enterprise" ? t.contactSales : t.getStarted}
                    </a>
                  ) : (
                    <PlanCta
                      plan={plan}
                      currentPlan={currentPlan}
                      interval={interval}
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

function PlanCta({
  plan,
  currentPlan,
  interval,
  onResult,
}: {
  plan: PlanDefinition;
  currentPlan?: BillingPlanId;
  interval: "month" | "year";
  onResult: (state: BillingActionState) => void;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.billingUi;
  const from = currentPlan ?? "free";
  const rank = { free: 1, pro: 2, enterprise: 3 } as const;
  const isUpgrade = rank[plan.id] > rank[from];
  const isDowngrade = rank[plan.id] < rank[from];

  if (plan.id === "free" && from !== "free") {
    return (
      <BillingActionButton
        action={changePlanAction}
        label={t.changePlan}
        pendingLabel={t.preparing}
        variant="secondary"
        className="w-full [&_button]:w-full"
        hiddenFields={{
          fromPlan: from,
          toPlan: plan.id,
          interval,
        }}
        onResult={onResult}
      />
    );
  }

  if (from === "free") {
    return (
      <BillingActionButton
        action={purchasePlanAction}
        label={t.purchase}
        pendingLabel={t.preparing}
        className="w-full [&_button]:w-full"
        hiddenFields={{ plan: plan.id, interval }}
        onResult={onResult}
      />
    );
  }

  if (isUpgrade) {
    return (
      <BillingActionButton
        action={upgradePlanAction}
        label={t.upgrade}
        pendingLabel={t.preparing}
        className="w-full [&_button]:w-full"
        hiddenFields={{ fromPlan: from, toPlan: plan.id, interval }}
        onResult={onResult}
      />
    );
  }

  if (isDowngrade) {
    return (
      <BillingActionButton
        action={changePlanAction}
        label={t.changePlan}
        pendingLabel={t.preparing}
        variant="secondary"
        className="w-full [&_button]:w-full"
        hiddenFields={{ fromPlan: from, toPlan: plan.id, interval }}
        onResult={onResult}
      />
    );
  }

  return null;
}

function IntervalToggle({
  interval,
  onChange,
}: {
  interval: "month" | "year";
  onChange: (value: "month" | "year") => void;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.billingUi;

  return (
    <div
      className="inline-flex rounded-xl border border-zt-border bg-zt-surface p-1"
      role="group"
      aria-label={t.billingInterval}
    >
      {(["month", "year"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            interval === value
              ? "bg-zt-primary text-white"
              : "text-zt-muted hover:text-zt-text"
          }`}
          aria-pressed={interval === value}
        >
          {value === "month" ? t.monthly : t.yearly}
        </button>
      ))}
    </div>
  );
}
