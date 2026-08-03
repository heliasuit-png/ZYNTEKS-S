import {
  AI_MONTHLY_MESSAGE_LIMITS,
  PLAN_LIMITS,
} from "@/lib/constants";
import type { PlanDefinition } from "@/services/billing/types";

/**
 * Display catalog for pricing / comparison UI.
 * Amounts are for presentation only — nothing is charged until a
 * PaymentProvider is implemented and registered in `factory.ts`.
 */
export const BILLING_CATALOG: readonly PlanDefinition[] = [
  {
    id: "free",
    name: "Starter",
    description: "For individuals evaluating ZYNTEKSIS in production-ready form.",
    highlighted: false,
    prices: [
      { interval: "month", amountCents: 0, currency: "USD" },
      { interval: "year", amountCents: 0, currency: "USD" },
    ],
    limits: {
      projects: PLAN_LIMITS.free.projects,
      apiKeysPerProject: PLAN_LIMITS.free.apiKeysPerProject,
      aiMessagesPerMonth: AI_MONTHLY_MESSAGE_LIMITS.free,
      seats: 3,
    },
    features: [
      { id: "projects", label: "Projects", included: true, value: String(PLAN_LIMITS.free.projects) },
      {
        id: "api-keys",
        label: "API keys / project",
        included: true,
        value: String(PLAN_LIMITS.free.apiKeysPerProject),
      },
      {
        id: "ai",
        label: "AI messages / month",
        included: true,
        value: String(AI_MONTHLY_MESSAGE_LIMITS.free),
      },
      { id: "error-monitoring", label: "Error monitoring", included: true },
      { id: "health", label: "Health checks", included: true },
      { id: "status-pages", label: "Status pages", included: true },
      { id: "sso", label: "SSO / SAML", included: false },
      { id: "priority", label: "Priority support", included: false },
    ],
    cta: "purchase",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams that need higher limits and unlimited AI.",
    highlighted: true,
    prices: [
      { interval: "month", amountCents: 4900, currency: "USD" },
      { interval: "year", amountCents: 49000, currency: "USD" },
    ],
    limits: {
      projects: PLAN_LIMITS.pro.projects,
      apiKeysPerProject: PLAN_LIMITS.pro.apiKeysPerProject,
      aiMessagesPerMonth: AI_MONTHLY_MESSAGE_LIMITS.pro,
      seats: 25,
    },
    features: [
      { id: "projects", label: "Projects", included: true, value: String(PLAN_LIMITS.pro.projects) },
      {
        id: "api-keys",
        label: "API keys / project",
        included: true,
        value: String(PLAN_LIMITS.pro.apiKeysPerProject),
      },
      { id: "ai", label: "AI messages / month", included: true, value: "Unlimited" },
      { id: "error-monitoring", label: "Error monitoring", included: true },
      { id: "health", label: "Health checks", included: true },
      { id: "status-pages", label: "Status pages", included: true },
      { id: "sso", label: "SSO / SAML", included: false },
      { id: "priority", label: "Priority support", included: true },
    ],
    cta: "upgrade",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For organizations that need maximum scale and dedicated support.",
    highlighted: false,
    prices: [
      { interval: "month", amountCents: 19900, currency: "USD" },
      { interval: "year", amountCents: 199000, currency: "USD" },
    ],
    limits: {
      projects: PLAN_LIMITS.enterprise.projects,
      apiKeysPerProject: PLAN_LIMITS.enterprise.apiKeysPerProject,
      aiMessagesPerMonth: AI_MONTHLY_MESSAGE_LIMITS.enterprise,
      seats: null,
    },
    features: [
      {
        id: "projects",
        label: "Projects",
        included: true,
        value: String(PLAN_LIMITS.enterprise.projects),
      },
      {
        id: "api-keys",
        label: "API keys / project",
        included: true,
        value: String(PLAN_LIMITS.enterprise.apiKeysPerProject),
      },
      { id: "ai", label: "AI messages / month", included: true, value: "Unlimited" },
      { id: "error-monitoring", label: "Error monitoring", included: true },
      { id: "health", label: "Health checks", included: true },
      { id: "status-pages", label: "Status pages", included: true },
      { id: "sso", label: "SSO / SAML", included: true },
      { id: "priority", label: "Priority support", included: true },
    ],
    cta: "contact",
  },
] as const;

export function getPlanDefinition(planId: string): PlanDefinition {
  return (
    BILLING_CATALOG.find((plan) => plan.id === planId) ?? BILLING_CATALOG[0]!
  );
}

export function comparePlans(): {
  featureIds: string[];
  featureLabels: Record<string, string>;
  plans: readonly PlanDefinition[];
} {
  const featureIds: string[] = [];
  const featureLabels: Record<string, string> = {};
  for (const plan of BILLING_CATALOG) {
    for (const feature of plan.features) {
      if (!featureIds.includes(feature.id)) {
        featureIds.push(feature.id);
        featureLabels[feature.id] = feature.label;
      }
    }
  }
  return { featureIds, featureLabels, plans: BILLING_CATALOG };
}
