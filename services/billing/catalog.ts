import {
  AI_MONTHLY_MESSAGE_LIMITS,
  PLAN_LIMITS,
} from "@/lib/constants";
import type {
  BillingPlanId,
  CommercialPlanId,
  PlanDefinition,
} from "@/services/billing/types";

/**
 * Commercial display catalog for /billing and comparison UI.
 * Slugs: free | developer | pro | business.
 * Amounts are presentation-only; checkout variants come from server env.
 *
 * Local entitlement DB enum remains free | pro | enterprise
 * (see entitlementPlanFromCheckoutPlan).
 */
export type { CommercialPlanId };

export const BILLING_CATALOG: readonly PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    description: "Get to know Zynteksis with a small project.",
    highlighted: false,
    prices: [{ interval: "month", amountCents: 0, currency: "USD" }],
    limits: {
      projects: PLAN_LIMITS.free.projects,
      apiKeysPerProject: PLAN_LIMITS.free.apiKeysPerProject,
      aiMessagesPerMonth: AI_MONTHLY_MESSAGE_LIMITS.free,
      seats: 1,
    },
    features: [
      {
        id: "projects",
        label: "Projects",
        included: true,
        value: String(PLAN_LIMITS.free.projects),
      },
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
    id: "developer",
    name: "Developer",
    description: "For individual developers and freelancers.",
    highlighted: false,
    prices: [{ interval: "month", amountCents: 1900, currency: "USD" }],
    limits: {
      // Entitlement maps developer → pro limits after webhook.
      projects: PLAN_LIMITS.pro.projects,
      apiKeysPerProject: PLAN_LIMITS.pro.apiKeysPerProject,
      aiMessagesPerMonth: AI_MONTHLY_MESSAGE_LIMITS.pro,
      seats: 1,
    },
    features: [
      {
        id: "projects",
        label: "Projects",
        included: true,
        value: String(PLAN_LIMITS.pro.projects),
      },
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
      { id: "priority", label: "Priority support", included: false },
    ],
    cta: "purchase",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For professional developers, freelancers, and small teams.",
    highlighted: true,
    prices: [{ interval: "month", amountCents: 4900, currency: "USD" }],
    limits: {
      projects: PLAN_LIMITS.pro.projects,
      apiKeysPerProject: PLAN_LIMITS.pro.apiKeysPerProject,
      aiMessagesPerMonth: AI_MONTHLY_MESSAGE_LIMITS.pro,
      seats: 25,
    },
    features: [
      {
        id: "projects",
        label: "Projects",
        included: true,
        value: String(PLAN_LIMITS.pro.projects),
      },
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
    id: "business",
    name: "Business",
    description: "For growing software teams and companies.",
    highlighted: false,
    prices: [{ interval: "month", amountCents: 29900, currency: "USD" }],
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
    cta: "upgrade",
  },
] as const;

/** Map local entitlement enum → commercial catalog card used for limits UI. */
export function commercialPlanFromEntitlement(
  plan: BillingPlanId,
): CommercialPlanId {
  switch (plan) {
    case "enterprise":
      return "business";
    case "pro":
      return "pro";
    default:
      return "free";
  }
}

/**
 * Resolve catalog entry for an entitlement or commercial id.
 * Entitlement `enterprise` maps to commercial `business`.
 */
export function getPlanDefinition(planId: string): PlanDefinition {
  const normalized =
    planId === "enterprise"
      ? "business"
      : planId === "developer" ||
          planId === "pro" ||
          planId === "business" ||
          planId === "free"
        ? planId
        : commercialPlanFromEntitlement(
            (planId as BillingPlanId) || "free",
          );

  return (
    BILLING_CATALOG.find((plan) => plan.id === normalized) ?? BILLING_CATALOG[0]!
  );
}

export function comparePlans(): {
  featureIds: string[];
  plans: readonly PlanDefinition[];
} {
  const featureIds: string[] = [];
  for (const plan of BILLING_CATALOG) {
    for (const feature of plan.features) {
      if (!featureIds.includes(feature.id)) {
        featureIds.push(feature.id);
      }
    }
  }
  return { featureIds, plans: BILLING_CATALOG };
}
