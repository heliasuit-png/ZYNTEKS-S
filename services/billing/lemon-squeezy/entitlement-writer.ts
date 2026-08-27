/**
 * Persist Lemon Squeezy entitlements + optional billing mirror tables.
 * Plan of record: profiles.subscription_plan / workspaces.plan.
 * AI quotas follow plan limits — no separate credit grant on checkout.
 */

import "server-only";

import type { EntitlementWriter } from "@/services/billing/lemon-squeezy/webhook-processor";
import type { TypedSupabaseClient } from "@/supabase/types";

type UntypedClient = {
  from: (table: string) => {
    update: (values: Record<string, unknown>) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{ error: { message: string } | null }>;
    };
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

export function createSupabaseEntitlementWriter(
  admin: TypedSupabaseClient,
): EntitlementWriter {
  const raw = admin as unknown as UntypedClient;

  return {
    async applyPlan(input) {
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
          await raw.from("billing_subscriptions").upsert(
            {
              user_id: input.userId,
              workspace_id: input.workspaceId,
              provider: "lemonsqueezy",
              provider_subscription_id: input.providerSubscriptionId,
              provider_customer_id: input.providerCustomerId,
              plan: input.plan,
              status: input.status,
              paid_access_active: input.paidAccessActive,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "provider,provider_subscription_id" },
          );
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
