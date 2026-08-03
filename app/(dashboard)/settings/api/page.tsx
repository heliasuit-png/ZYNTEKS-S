import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { ROUTES } from "@/lib/constants";
import {
  getPlanLimits,
  getSubscriptionPlan,
} from "@/services/account/plan.service";
import { getAuthenticatedUser } from "@/services/auth";
import { getNotificationPreferences } from "@/services/notifications";
import { createSupabaseServerClient } from "@/supabase/server";
import { ApiSettingsPanel } from "@/features/settings/components/api-settings";

export const metadata: Metadata = { title: "API Settings" };

export default async function ApiSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect(ROUTES.login);

  const [plan, prefs, activeKeys, allKeys] = await Promise.all([
    getSubscriptionPlan(supabase, user.id),
    getNotificationPreferences(supabase, user.id),
    supabase
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const webhookParts = [
    prefs?.slack_enabled ? "Slack enabled" : "Slack off",
    prefs?.discord_enabled ? "Discord enabled" : "Discord off",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="API settings"
        description="API keys, SDK keys, webhooks and plan rate limits."
      />
      <ApiSettingsPanel
        activeKeyCount={activeKeys.count ?? 0}
        totalKeyCount={allKeys.count ?? 0}
        plan={plan}
        limits={getPlanLimits(plan)}
        webhookHint={webhookParts.join(" · ")}
      />
    </div>
  );
}
