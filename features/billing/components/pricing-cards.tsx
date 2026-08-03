"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";

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
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-zt-muted">{plan.description}</p>
                  </div>
                  {plan.highlighted ? <Badge tone="primary">Popular</Badge> : null}
                  {isCurrent ? <Badge tone="success">Current</Badge> : null}
                </div>

                <p className="mt-6 text-3xl font-semibold text-zt-text">
                  {formatMoney(price.amountCents, price.currency)}
                  <span className="text-sm font-normal text-zt-muted">
                    /{interval === "year" ? "yr" : "mo"}
                  </span>
                </p>

                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  <li className="text-zt-muted">
                    {formatLimit(plan.limits.projects)} projects
                  </li>
                  <li className="text-zt-muted">
                    {formatLimit(plan.limits.apiKeysPerProject)} API keys / project
                  </li>
                  <li className="text-zt-muted">
                    {formatLimit(plan.limits.aiMessagesPerMonth)} AI messages / month
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
                        {feature.label}
                      </li>
                    ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <p className="rounded-xl border border-zt-border px-3 py-2 text-center text-sm text-zt-muted">
                      Your current plan
                    </p>
                  ) : mode === "marketing" && !authenticated ? (
                    <a
                      href={`/register?plan=${plan.id}`}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-zt-primary text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
                    >
                      {plan.id === "enterprise" ? "Contact sales" : "Get started"}
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
  const from = currentPlan ?? "free";
  const rank = { free: 1, pro: 2, enterprise: 3 } as const;
  const isUpgrade = rank[plan.id] > rank[from];
  const isDowngrade = rank[plan.id] < rank[from];

  if (plan.id === "free" && from !== "free") {
    return (
      <BillingActionButton
        action={changePlanAction}
        label="Change plan"
        pendingLabel="Preparing…"
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
        label={plan.id === "enterprise" ? "Purchase" : "Purchase"}
        pendingLabel="Preparing…"
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
        label="Upgrade"
        pendingLabel="Preparing…"
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
        label="Change plan"
        pendingLabel="Preparing…"
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
  return (
    <div
      className="inline-flex rounded-xl border border-zt-border bg-zt-surface p-1"
      role="group"
      aria-label="Billing interval"
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
          {value === "month" ? "Monthly" : "Yearly"}
        </button>
      ))}
    </div>
  );
}
