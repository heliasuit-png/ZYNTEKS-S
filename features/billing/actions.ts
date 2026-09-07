"use server";

import { isAppError } from "@/lib/errors";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAuthenticatedUser } from "@/services/auth";
import { getBillingService } from "@/services/billing";
import type {
  BillingActionResult,
  BillingInterval,
  BillingPlanId,
} from "@/services/billing/types";
import { resolveActiveWorkspace } from "@/services/workspace";
import { createSupabaseServerClient } from "@/supabase/server";
import {
  initialBillingActionState,
  type BillingActionState,
} from "@/features/billing/types";

function toState(result: BillingActionResult): BillingActionState {
  return {
    status: result.status,
    message: result.message,
    redirectUrl: result.redirectUrl,
    providerId: result.providerId,
  };
}

async function fail(error: unknown): Promise<BillingActionState> {
  const { dict } = await getDictionary();
  return {
    status: "error",
    message: isAppError(error)
      ? error.message
      : dict.actionMessages.billingFailed,
  };
}

async function requireContext() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user?.email) {
    return null;
  }
  const { active } = await resolveActiveWorkspace(
    supabase,
    user.id,
    user.email,
  );
  return { supabase, user, workspaceId: active.id, email: user.email };
}

/**
 * Server actions for Upgrade / Purchase / Manage / Change Plan.
 * All payment side-effects are isolated inside BillingService → PaymentProvider.
 */
export async function purchasePlanAction(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  try {
    const { dict } = await getDictionary();
    const ctx = await requireContext();
    if (!ctx) {
      return { status: "error", message: dict.actionMessages.mustSignIn };
    }
    const plan = String(formData.get("plan") ?? "pro") as BillingPlanId;
    const interval = String(formData.get("interval") ?? "month") as BillingInterval;
    const result = await getBillingService().startPurchase({
      supabase: ctx.supabase,
      userId: ctx.user.id,
      email: ctx.email,
      workspaceId: ctx.workspaceId,
      plan,
      interval,
    });
    return toState(result);
  } catch (error) {
    return fail(error);
  }
}

export async function upgradePlanAction(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  try {
    const { dict } = await getDictionary();
    const ctx = await requireContext();
    if (!ctx) {
      return { status: "error", message: dict.actionMessages.mustSignIn };
    }
    const toPlan = String(formData.get("toPlan") ?? "pro") as BillingPlanId;
    const fromPlan = String(formData.get("fromPlan") ?? "free") as BillingPlanId;
    const interval = String(formData.get("interval") ?? "month") as BillingInterval;
    const result = await getBillingService().startUpgrade({
      supabase: ctx.supabase,
      userId: ctx.user.id,
      email: ctx.email,
      workspaceId: ctx.workspaceId,
      fromPlan,
      toPlan,
      interval,
    });
    return toState(result);
  } catch (error) {
    return fail(error);
  }
}

export async function changePlanAction(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  try {
    const { dict } = await getDictionary();
    const ctx = await requireContext();
    if (!ctx) {
      return { status: "error", message: dict.actionMessages.mustSignIn };
    }
    const toPlan = String(formData.get("toPlan") ?? "pro") as BillingPlanId;
    const fromPlan = String(formData.get("fromPlan") ?? "free") as BillingPlanId;
    const interval = String(formData.get("interval") ?? "month") as BillingInterval;
    const result = await getBillingService().changePlan({
      supabase: ctx.supabase,
      userId: ctx.user.id,
      email: ctx.email,
      workspaceId: ctx.workspaceId,
      fromPlan,
      toPlan,
      interval,
    });
    return toState(result);
  } catch (error) {
    return fail(error);
  }
}

export async function manageSubscriptionAction(
  _prev: BillingActionState = initialBillingActionState,
  _formData?: FormData,
): Promise<BillingActionState> {
  try {
    const { dict } = await getDictionary();
    const ctx = await requireContext();
    if (!ctx) {
      return { status: "error", message: dict.actionMessages.mustSignIn };
    }
    const overview = await getBillingService().getOverview(
      ctx.supabase,
      ctx.user.id,
      ctx.email,
    );
    const result = await getBillingService().manageSubscription({
      userId: ctx.user.id,
      email: ctx.email,
      workspaceId: ctx.workspaceId,
      providerCustomerId: overview.subscription.providerCustomerId,
    });
    return toState(result);
  } catch (error) {
    return fail(error);
  }
}
