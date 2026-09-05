/**
 * Commercial checkout plans (marketing) ↔ Lemon variant env mapping.
 * Entitlement plan of record remains DB enum: free | pro | enterprise.
 */

import type { BillingPlanId } from "@/services/billing/types";
import type { PricingPresentationPlanId } from "@/services/billing/pricing-presentation";

export const LEMON_CHECKOUT_PLANS = [
  "developer",
  "pro",
  "business",
] as const;

export type LemonCheckoutPlanId = (typeof LEMON_CHECKOUT_PLANS)[number];

export function isLemonCheckoutPlanId(
  value: unknown,
): value is LemonCheckoutPlanId {
  return (
    typeof value === "string" &&
    (LEMON_CHECKOUT_PLANS as readonly string[]).includes(value)
  );
}

/**
 * Map Lemon commercial plan → local subscription_plan enum.
 * Avoids expanding the DB enum until product decides otherwise.
 */
export function entitlementPlanFromCheckoutPlan(
  plan: LemonCheckoutPlanId,
): BillingPlanId {
  switch (plan) {
    case "developer":
    case "pro":
      return "pro";
    case "business":
      return "enterprise";
  }
}

export function isPaidPresentationPlan(
  plan: PricingPresentationPlanId,
): plan is LemonCheckoutPlanId {
  return isLemonCheckoutPlanId(plan);
}

export interface CheckoutVariantMapping {
  developer: string | null;
  pro: string | null;
  business: string | null;
}

export function loadCheckoutVariantMapping(
  env: Record<string, string | undefined> = process.env,
): CheckoutVariantMapping {
  return {
    developer: emptyToNull(env.LEMON_SQUEEZY_VARIANT_DEVELOPER),
    pro: emptyToNull(
      env.LEMON_SQUEEZY_VARIANT_PRO ?? env.LEMON_SQUEEZY_VARIANT_PRO_MONTH,
    ),
    business: emptyToNull(
      env.LEMON_SQUEEZY_VARIANT_BUSINESS ??
        env.LEMON_SQUEEZY_VARIANT_ENTERPRISE_MONTH,
    ),
  };
}

function emptyToNull(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

export function resolveCheckoutVariantId(
  plan: LemonCheckoutPlanId,
  mapping: CheckoutVariantMapping = loadCheckoutVariantMapping(),
): string | null {
  return mapping[plan] ?? null;
}

export function requireCheckoutVariantId(
  plan: LemonCheckoutPlanId,
  mapping?: CheckoutVariantMapping,
): string {
  const id = resolveCheckoutVariantId(plan, mapping);
  if (!id) {
    throw new Error(
      `No Lemon Squeezy variant configured for checkout plan=${plan}`,
    );
  }
  return id;
}

/** Reverse map variant → commercial plan (webhook). */
export function checkoutPlanFromVariantId(
  variantId: string | null | undefined,
  mapping: CheckoutVariantMapping = loadCheckoutVariantMapping(),
): LemonCheckoutPlanId | null {
  if (!variantId) return null;
  for (const plan of LEMON_CHECKOUT_PLANS) {
    if (mapping[plan] === variantId) return plan;
  }
  return null;
}

export function entitlementPlanFromVariantId(
  variantId: string | null | undefined,
  mapping?: CheckoutVariantMapping,
): BillingPlanId | null {
  const commercial = checkoutPlanFromVariantId(variantId, mapping);
  if (!commercial) return null;
  return entitlementPlanFromCheckoutPlan(commercial);
}

export function checkoutVariantMappingPresence(
  mapping: CheckoutVariantMapping,
): Record<string, "SET" | "UNSET"> {
  return {
    DEVELOPER: mapping.developer ? "SET" : "UNSET",
    PRO: mapping.pro ? "SET" : "UNSET",
    BUSINESS: mapping.business ? "SET" : "UNSET",
  };
}

export function hasAllCheckoutVariants(
  mapping: CheckoutVariantMapping = loadCheckoutVariantMapping(),
): boolean {
  return Boolean(mapping.developer && mapping.pro && mapping.business);
}
