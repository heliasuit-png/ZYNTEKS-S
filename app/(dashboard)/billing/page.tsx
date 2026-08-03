import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { getBillingService } from "@/services/billing";
import { comparePlans } from "@/services/billing/catalog";
import { createSupabaseServerClient } from "@/supabase/server";
import { BillingDashboard } from "@/features/billing/components/billing-dashboard";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(ROUTES.login);
  }

  const billing = getBillingService();
  const overview = await billing.getOverview(supabase, user.id, user.email);
  const catalog = billing.getCatalog();
  const comparison = comparePlans();

  return (
    <BillingDashboard
      overview={overview}
      catalog={catalog}
      comparison={comparison}
    />
  );
}
