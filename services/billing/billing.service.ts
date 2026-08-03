import "server-only";

import { AI_MONTHLY_MESSAGE_LIMITS } from "@/lib/constants";
import { env } from "@/lib/env";
import { getPlanLimits, getSubscriptionPlan } from "@/services/account/plan.service";
import { BILLING_CATALOG, getPlanDefinition } from "@/services/billing/catalog";
import { getPaymentProvider } from "@/services/billing/factory";
import type { PaymentProvider } from "@/services/billing/provider";
import type {
  BillingActionResult,
  BillingInterval,
  BillingOverview,
  BillingPlanId,
  BillingSubscription,
  BillingUsageSnapshot,
  PlanDefinition,
} from "@/services/billing/types";
import {
  getWorkspaceUsage,
  resolveActiveWorkspace,
} from "@/services/workspace";
import type { TypedSupabaseClient } from "@/supabase/client";

type Supabase = TypedSupabaseClient;

/**
 * BillingService — application-facing billing API.
 *
 * All Upgrade / Purchase / Manage / Change Plan flows go through here so the
 * UI never talks to a payment SDK. Swap the PaymentProvider in `factory.ts`
 * to enable real checkout without rewriting pages.
 */
export class BillingService {
  constructor(private readonly provider: PaymentProvider = getPaymentProvider()) {}

  getCatalog(): readonly PlanDefinition[] {
    return BILLING_CATALOG;
  }

  getProviderMeta(): {
    id: string;
    displayName: string;
    configured: boolean;
  } {
    return {
      id: this.provider.id,
      displayName: this.provider.displayName,
      configured: this.provider.isConfigured(),
    };
  }

  async getOverview(
    supabase: Supabase,
    userId: string,
    email: string | null | undefined,
  ): Promise<BillingOverview> {
    const [{ active }, profilePlan] = await Promise.all([
      resolveActiveWorkspace(supabase, userId, email),
      getSubscriptionPlan(supabase, userId),
    ]);

    const plan = (active.plan || profilePlan) as BillingPlanId;
    const usageRaw = await getWorkspaceUsage(supabase, active.id);
    const limits = getPlanLimits(plan);
    const planDef = getPlanDefinition(plan);

    // Future provider: load providerCustomerId from a billing_customers table
    // and merge live subscription + invoices from this.provider.
    const providerSubscription = await this.provider.getSubscription(null);
    const invoices = await this.provider.listInvoices(null);

    const subscription: BillingSubscription = providerSubscription ?? {
      plan,
      status: "active",
      seats: usageRaw.memberCount,
      amountDueCents: 0,
      currency: "USD",
      interval: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      providerCustomerId: null,
      providerSubscriptionId: null,
    };

    // Prefer local plan of record when provider is not configured.
    if (!this.provider.isConfigured()) {
      subscription.plan = plan;
      subscription.status = "active";
      subscription.seats = usageRaw.memberCount;
    }

    const usage: BillingUsageSnapshot = {
      projects: usageRaw.projectCount,
      projectLimit: limits.projects,
      apiKeys: usageRaw.apiKeyCount,
      apiKeysPerProject: limits.apiKeysPerProject,
      members: usageRaw.memberCount,
      memberLimit: planDef.limits.seats,
      aiMessages30d: usageRaw.aiMessageCount,
      aiMessageLimit: AI_MONTHLY_MESSAGE_LIMITS[plan] ?? null,
    };

    return {
      subscription,
      usage,
      invoices,
      providerConfigured: this.provider.isConfigured(),
      providerId: this.provider.id,
      providerDisplayName: this.provider.displayName,
    };
  }

  async startPurchase(input: {
    supabase: Supabase;
    userId: string;
    email: string;
    workspaceId: string;
    plan: BillingPlanId;
    interval: BillingInterval;
  }): Promise<BillingActionResult> {
    const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    return this.provider.createCheckoutSession({
      userId: input.userId,
      workspaceId: input.workspaceId,
      email: input.email,
      plan: input.plan,
      interval: input.interval,
      successUrl: `${base}/billing?checkout=success`,
      cancelUrl: `${base}/billing?checkout=canceled`,
    });
  }

  async startUpgrade(input: {
    supabase: Supabase;
    userId: string;
    email: string;
    workspaceId: string;
    toPlan: BillingPlanId;
    interval: BillingInterval;
    fromPlan: BillingPlanId;
  }): Promise<BillingActionResult> {
    // Free → paid uses checkout; paid → paid uses changePlan.
    if (input.fromPlan === "free") {
      return this.startPurchase({
        supabase: input.supabase,
        userId: input.userId,
        email: input.email,
        workspaceId: input.workspaceId,
        plan: input.toPlan,
        interval: input.interval,
      });
    }
    return this.changePlan({
      supabase: input.supabase,
      userId: input.userId,
      email: input.email,
      workspaceId: input.workspaceId,
      fromPlan: input.fromPlan,
      toPlan: input.toPlan,
      interval: input.interval,
    });
  }

  async manageSubscription(input: {
    userId: string;
    email: string;
    workspaceId: string;
    providerCustomerId: string | null;
  }): Promise<BillingActionResult> {
    const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    return this.provider.createBillingPortalSession({
      userId: input.userId,
      workspaceId: input.workspaceId,
      email: input.email,
      returnUrl: `${base}/billing`,
      providerCustomerId: input.providerCustomerId,
    });
  }

  async changePlan(input: {
    supabase: Supabase;
    userId: string;
    email: string;
    workspaceId: string;
    fromPlan: BillingPlanId;
    toPlan: BillingPlanId;
    interval: BillingInterval;
    providerSubscriptionId?: string | null;
  }): Promise<BillingActionResult> {
    return this.provider.changePlan({
      userId: input.userId,
      workspaceId: input.workspaceId,
      email: input.email,
      fromPlan: input.fromPlan,
      toPlan: input.toPlan,
      interval: input.interval,
      providerSubscriptionId: input.providerSubscriptionId ?? null,
    });
  }
}

let defaultService: BillingService | null = null;

export function getBillingService(): BillingService {
  if (!defaultService) {
    defaultService = new BillingService();
  }
  return defaultService;
}
