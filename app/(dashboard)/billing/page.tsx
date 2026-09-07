import { redirect } from "next/navigation";
import { dashboardPageMetadata } from "@/lib/i18n/dashboard-metadata";
import { getDictionary } from "@/lib/i18n/get-dictionary";

import { ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { getBillingService } from "@/services/billing";
import { comparePlans } from "@/services/billing/catalog";
import {
  hasAllCheckoutVariants,
  loadCheckoutVariantMapping,
} from "@/services/billing/lemon-squeezy/checkout-plans";
import { isLemonCheckoutUiEnabled } from "@/services/billing/lemon-squeezy/config";
import { createSupabaseServerClient } from "@/supabase/server";
import { BillingDashboard } from "@/features/billing/components/billing-dashboard";

export const generateMetadata = () => dashboardPageMetadata("billing");

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { dict } = await getDictionary();
  const billingUi = dict.dash.billingUi;
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(ROUTES.login);
  }

  const params = await searchParams;
  const billing = getBillingService();
  const overview = await billing.getOverview(supabase, user.id, user.email);
  const catalog = billing.getCatalog();
  const comparison = comparePlans();
  const checkoutEnabled =
    isLemonCheckoutUiEnabled() &&
    hasAllCheckoutVariants(loadCheckoutVariantMapping());

  const checkoutNotice =
    params.checkout === "returned"
      ? billingUi.checkoutReturned
      : params.checkout === "canceled"
        ? billingUi.checkoutCanceled
        : params.checkout === "success"
          ? billingUi.checkoutSuccess
          : null;

  return (
    <BillingDashboard
      overview={overview}
      catalog={catalog}
      comparison={comparison}
      checkoutNotice={checkoutNotice}
      checkoutEnabled={checkoutEnabled}
    />
  );
}
