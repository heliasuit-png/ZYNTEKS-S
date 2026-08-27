"use client";

import { Check, Minus } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import type { comparePlans } from "@/services/billing/catalog";
import type { BillingPlanId } from "@/services/billing/types";
import { formatMoney } from "@/utils/billing";

export function PlanComparison({
  comparison,
}: {
  comparison: ReturnType<typeof comparePlans>;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.billingUi;
  const { featureIds, plans } = comparison;

  return (
    <FadeIn>
      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>{t.planComparison}</PanelTitle>
            <PanelDescription>{t.planComparisonDesc}</PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">{t.featureComparisonCaption}</caption>
            <thead>
              <tr className="border-b border-zt-border text-left">
                <th scope="col" className="py-3 pr-4 font-medium text-zt-muted">
                  {t.feature}
                </th>
                {plans.map((plan) => {
                  const monthly =
                    plan.prices.find((p) => p.interval === "month") ??
                    plan.prices[0]!;
                  const planCopy = t.catalog[plan.id as BillingPlanId];
                  return (
                    <th
                      key={plan.id}
                      scope="col"
                      className="px-3 py-3 font-semibold text-zt-text"
                    >
                      <div>{planCopy.name}</div>
                      <div className="mt-1 text-xs font-normal text-zt-muted">
                        {formatMoney(monthly.amountCents, monthly.currency)}
                        {t.perMonth}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {featureIds.map((featureId) => {
                const featureLabel =
                  t.catalog.features[
                    featureId as keyof typeof t.catalog.features
                  ] ?? featureId;
                return (
                  <tr key={featureId} className="border-b border-zt-border/60">
                    <th
                      scope="row"
                      className="py-3 pr-4 text-left font-normal text-zt-muted"
                    >
                      {featureLabel}
                    </th>
                    {plans.map((plan) => {
                      const feature = plan.features.find(
                        (f) => f.id === featureId,
                      );
                      const value =
                        feature?.value === "Unlimited"
                          ? t.unlimited
                          : feature?.value;
                      return (
                        <td key={plan.id} className="px-3 py-3 text-zt-text">
                          {value ? (
                            value
                          ) : feature?.included ? (
                            <Check
                              className="size-4 text-zt-success"
                              aria-label={t.included}
                            />
                          ) : (
                            <Minus
                              className="size-4 text-zt-muted"
                              aria-label={t.notIncluded}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PanelContent>
      </Panel>
    </FadeIn>
  );
}
