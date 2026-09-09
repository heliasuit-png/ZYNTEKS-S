/**
 * Persist Lemon Squeezy entitlements + optional billing mirror tables.
 * Plan of record: profiles.subscription_plan / workspaces.plan.
 * AI quotas follow plan limits — no separate credit grant on checkout.
 */

import "server-only";

import type { EntitlementWriter } from "@/services/billing/lemon-squeezy/webhook-processor";
import {
  SIBLING_SUPERSEDED_STATUS,
  shouldDeactivateSiblingSubscriptions,
} from "@/services/billing/lemon-squeezy/sibling-deactivation";
import type { TypedSupabaseClient } from "@/supabase/types";

/** Minimal untyped surface for optional billing_* tables (may be missing). */
type UntypedClient = {
  from: (table: string) => {
    update: (values: Record<string, unknown>) => unknown;
    upsert: (
      values: Record<string, unknown>,
      opts?: { onConflict?: string },
    ) => Promise<{ error: { message: string } | null }>;
    insert: (
      values: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>;
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        eq: (
          column: string,
          value: string,
        ) => {
          maybeSingle: () => Promise<{
            data: { event_id?: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

type FilterChain = {
  eq: (column: string, value: string | boolean) => FilterChain;
  neq: (
    column: string,
    value: string,
  ) => PromiseLike<{ error: { message: string } | null }>;
};

/**
 * Close other paid Lemon mirror rows for this user/customer so only the
 * current provider_subscription_id remains paid_access_active.
 */
async function deactivateSiblingPaidSubscriptions(
  raw: UntypedClient,
  input: {
    userId: string;
    providerSubscriptionId: string;
    providerCustomerId: string | null;
  },
): Promise<void> {
  const patch = {
    paid_access_active: false,
    status: SIBLING_SUPERSEDED_STATUS,
    updated_at: new Date().toISOString(),
  };

  let query = (
    raw.from("billing_subscriptions").update(patch) as FilterChain
  )
    .eq("provider", "lemonsqueezy")
    .eq("user_id", input.userId)
    .eq("paid_access_active", true);

  if (input.providerCustomerId) {
    query = query.eq("provider_customer_id", input.providerCustomerId);
  }

  await query.neq(
    "provider_subscription_id",
    input.providerSubscriptionId,
  );
}

export function createSupabaseEntitlementWriter(
  admin: TypedSupabaseClient,
): EntitlementWriter {
  const raw = admin as unknown as UntypedClient;

  return {
    async applyPlan(input) {
      // Never trust webhook custom_data blindly — profile must exist.
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("id")
        .eq("id", input.userId)
        .maybeSingle();

      if (profileError || !profile?.id) {
        throw new Error(
          "Webhook user_id does not match an existing profile — entitlement skipped.",
        );
      }

      await admin
        .from("profiles")
        .update({ subscription_plan: input.plan })
        .eq("id", input.userId);

      if (input.workspaceId) {
        await admin
          .from("workspaces")
          .update({ plan: input.plan })
          .eq("id", input.workspaceId);
      }

      // Mirror tables from migration 0018 (ignore if missing).
      try {
        if (input.providerCustomerId) {
          await raw.from("billing_customers").upsert(
            {
              user_id: input.userId,
              workspace_id: input.workspaceId,
              provider: "lemonsqueezy",
              provider_customer_id: input.providerCustomerId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "provider,provider_customer_id" },
          );
        }
        if (input.providerSubscriptionId) {
          // Mirror commercial/Lemon ids only when provided — omit keeps prior DB values.
          const subscriptionRow: Record<string, unknown> = {
            user_id: input.userId,
            workspace_id: input.workspaceId,
            provider: "lemonsqueezy",
            provider_subscription_id: input.providerSubscriptionId,
            provider_customer_id: input.providerCustomerId,
            plan: input.plan,
            status: input.status,
            paid_access_active: input.paidAccessActive,
            updated_at: new Date().toISOString(),
          };
          if (input.commercialPlan) {
            subscriptionRow.commercial_plan = input.commercialPlan;
          }
          if (input.lemonVariantId) {
            subscriptionRow.lemon_variant_id = input.lemonVariantId;
          }
          if (input.lemonProductId) {
            subscriptionRow.lemon_product_id = input.lemonProductId;
          }
          if (input.lemonOrderId) {
            subscriptionRow.lemon_order_id = input.lemonOrderId;
          }

          await raw.from("billing_subscriptions").upsert(
            subscriptionRow,
            { onConflict: "provider,provider_subscription_id" },
          );

          if (
            shouldDeactivateSiblingSubscriptions({
              paidAccessActive: input.paidAccessActive,
              providerSubscriptionId: input.providerSubscriptionId,
              status: input.status,
            })
          ) {
            await deactivateSiblingPaidSubscriptions(raw, {
              userId: input.userId,
              providerSubscriptionId: input.providerSubscriptionId,
              providerCustomerId: input.providerCustomerId,
            });
          }
        }
      } catch {
        // optional until migration applied
      }
    },
  };
}

export function createSupabaseWebhookIdempotencyStore(
  admin: TypedSupabaseClient,
): {
  has: (eventId: string) => Promise<boolean>;
  mark: (eventId: string, eventName: string) => Promise<void>;
} {
  const raw = admin as unknown as UntypedClient;
  return {
    async has(eventId) {
      try {
        const { data } = await raw
          .from("billing_webhook_events")
          .select("event_id")
          .eq("provider", "lemonsqueezy")
          .eq("event_id", eventId)
          .maybeSingle();
        return Boolean(data?.event_id);
      } catch {
        return false;
      }
    },
    async mark(eventId, eventName) {
      try {
        await raw.from("billing_webhook_events").insert({
          provider: "lemonsqueezy",
          event_id: eventId,
          event_name: eventName,
        });
      } catch {
        // unique violation = already marked
      }
    },
  };
}
