import { Check, Minus } from "lucide-react";

import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import type { comparePlans } from "@/services/billing/catalog";
import { formatMoney } from "@/utils/billing";

export function PlanComparison({
  comparison,
}: {
  comparison: ReturnType<typeof comparePlans>;
}) {
  const { featureIds, featureLabels, plans } = comparison;

  return (
    <FadeIn>
      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Plan comparison</PanelTitle>
            <PanelDescription>
              Limits and features across Starter, Pro and Enterprise.
            </PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">
              Feature comparison by subscription plan
            </caption>
            <thead>
              <tr className="border-b border-zt-border text-left">
                <th scope="col" className="py-3 pr-4 font-medium text-zt-muted">
                  Feature
                </th>
                {plans.map((plan) => {
                  const monthly =
                    plan.prices.find((p) => p.interval === "month") ??
                    plan.prices[0]!;
                  return (
                    <th
                      key={plan.id}
                      scope="col"
                      className="px-3 py-3 font-semibold text-zt-text"
                    >
                      <div>{plan.name}</div>
                      <div className="mt-1 text-xs font-normal text-zt-muted">
                        {formatMoney(monthly.amountCents, monthly.currency)}/mo
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {featureIds.map((featureId) => (
                <tr key={featureId} className="border-b border-zt-border/60">
                  <th
                    scope="row"
                    className="py-3 pr-4 text-left font-normal text-zt-muted"
                  >
                    {featureLabels[featureId]}
                  </th>
                  {plans.map((plan) => {
                    const feature = plan.features.find((f) => f.id === featureId);
                    return (
                      <td key={plan.id} className="px-3 py-3 text-zt-text">
                        {feature?.value ? (
                          feature.value
                        ) : feature?.included ? (
                          <Check
                            className="size-4 text-zt-success"
                            aria-label="Included"
                          />
                        ) : (
                          <Minus
                            className="size-4 text-zt-muted"
                            aria-label="Not included"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </PanelContent>
      </Panel>
    </FadeIn>
  );
}
