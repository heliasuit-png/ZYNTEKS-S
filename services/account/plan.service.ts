import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanLimits } from "@/lib/constants";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { SubscriptionPlan } from "@/types/database";

type Supabase = TypedSupabaseClient;

/** Resolves the subscription plan for a user, defaulting to `free`. */
export async function getSubscriptionPlan(
  supabase: Supabase,
  userId: string,
): Promise<SubscriptionPlan> {
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return "free";
  }
  return data.subscription_plan;
}

/** Returns the resource limits for a subscription plan. */
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}
