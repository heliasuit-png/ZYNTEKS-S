import "server-only";

import { getBillingService } from "@/services/billing";
import type { BillingOverview as DomainOverview } from "@/services/billing";
import { getAuthenticatedUser } from "@/services/auth";
import { createSupabaseServerClient } from "@/supabase/server";
import type { BillingOverview } from "@/types/dashboard";

/**
 * Dashboard adapter over the domain BillingService.
 * Prefer importing from `@/services/billing` for new code.
 */
export async function getBillingOverview(): Promise<BillingOverview> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    return toDashboardOverview(await emptyDomainOverview());
  }

  const overview = await getBillingService().getOverview(
    supabase,
    user.id,
    user.email,
  );
  return toDashboardOverview(overview);
}

async function emptyDomainOverview(): Promise<DomainOverview> {
  const provider = getBillingService().getProviderMeta();
  return {
    subscription: {
      plan: "free",
      status: "active",
      seats: 1,
      amountDueCents: 0,
      currency: "USD",
      interval: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      providerCustomerId: null,
      providerSubscriptionId: null,
    },
    usage: {
      projects: 0,
      projectLimit: 3,
      apiKeys: 0,
      apiKeysPerProject: 3,
      members: 0,
      memberLimit: 3,
      aiMessages30d: 0,
      aiMessageLimit: 200,
    },
    invoices: [],
    providerConfigured: provider.configured,
    providerId: provider.id,
    providerDisplayName: provider.displayName,
  };
}

function toDashboardOverview(overview: DomainOverview): BillingOverview {
  return {
    plan: overview.subscription.plan,
    status:
      overview.subscription.status === "none" ||
      overview.subscription.status === "incomplete"
        ? "active"
        : overview.subscription.status,
    seats: overview.subscription.seats,
    amountDueCents: overview.subscription.amountDueCents,
    currency: overview.subscription.currency,
    nextInvoiceAt: overview.subscription.currentPeriodEnd,
    invoices: overview.invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      status:
        invoice.status === "draft" ? "open" : (invoice.status as "paid" | "open" | "void"),
      issuedAt: invoice.issuedAt,
    })),
    usage: {
      projects: overview.usage.projects,
      projectLimit: overview.usage.projectLimit,
      apiKeys: overview.usage.apiKeys,
      apiKeysPerProject: overview.usage.apiKeysPerProject,
      members: overview.usage.members,
      aiMessages30d: overview.usage.aiMessages30d,
    },
    providerConfigured: overview.providerConfigured,
    providerId: overview.providerId,
    providerDisplayName: overview.providerDisplayName,
  };
}
