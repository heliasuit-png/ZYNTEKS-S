/**
 * Plan → Lemon Squeezy variant mapping (env-driven).
 * Free has no paid variant. Never hardcode live variant IDs in source.
 */

import type { BillingInterval, BillingPlanId } from "@/services/billing/types";

export type PaidBillingPlanId = Exclude<BillingPlanId, "free">;

export interface VariantMapping {
  pro: { month: string | null; year: string | null };
  enterprise: { month: string | null; year: string | null };
}

export function loadVariantMapping(
  env: Record<string, string | undefined> = process.env,
): VariantMapping {
  return {
    pro: {
      month: emptyToNull(env.LEMON_SQUEEZY_VARIANT_PRO_MONTH),
      year: emptyToNull(env.LEMON_SQUEEZY_VARIANT_PRO_YEAR),
    },
    enterprise: {
      month: emptyToNull(env.LEMON_SQUEEZY_VARIANT_ENTERPRISE_MONTH),
      year: emptyToNull(env.LEMON_SQUEEZY_VARIANT_ENTERPRISE_YEAR),
    },
  };
}

function emptyToNull(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/**
 * Resolve Lemon Squeezy variant id for a paid plan + interval.
 * Returns null for free or missing mapping.
 */
export function resolveVariantId(
  plan: BillingPlanId,
  interval: BillingInterval,
  mapping: VariantMapping = loadVariantMapping(),
): string | null {
  if (plan === "free") return null;
  const row = mapping[plan];
  return row?.[interval] ?? null;
}

export function requireVariantId(
  plan: BillingPlanId,
  interval: BillingInterval,
  mapping?: VariantMapping,
): string {
  const id = resolveVariantId(plan, interval, mapping);
  if (!id) {
    throw new Error(
      `No Lemon Squeezy variant configured for plan=${plan} interval=${interval}`,
    );
  }
  return id;
}

/** Reverse map variant → plan (for webhook entitlement). */
export function planFromVariantId(
  variantId: string | null | undefined,
  mapping: VariantMapping = loadVariantMapping(),
): BillingPlanId | null {
  if (!variantId) return null;
  for (const plan of ["pro", "enterprise"] as const) {
    if (
      mapping[plan].month === variantId ||
      mapping[plan].year === variantId
    ) {
      return plan;
    }
  }
  return null;
}

export function variantMappingPresence(mapping: VariantMapping): Record<
  string,
  "SET" | "UNSET"
> {
  return {
    PRO_MONTH: mapping.pro.month ? "SET" : "UNSET",
    PRO_YEAR: mapping.pro.year ? "SET" : "UNSET",
    ENTERPRISE_MONTH: mapping.enterprise.month ? "SET" : "UNSET",
    ENTERPRISE_YEAR: mapping.enterprise.year ? "SET" : "UNSET",
  };
}
