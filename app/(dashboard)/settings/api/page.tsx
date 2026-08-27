import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { ROUTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  getPlanLimits,
  getSubscriptionPlan,
} from "@/services/account/plan.service";
import { getAuthenticatedUser } from "@/services/auth";
import { getNotificationPreferences } from "@/services/notifications";
import { createSupabaseServerClient } from "@/supabase/server";
import { ApiSettingsPanel } from "@/features/settings/components/api-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.dashboard.settingsSections.api.title };
}

export default async function ApiSettingsPage() {
  const { dict } = await getDictionary();
  const section = dict.dashboard.settingsSections.api;
  const apiCopy = dict.dash.settings.api;
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
    prefs?.slack_enabled ? apiCopy.slackEnabled : apiCopy.slackOff,
    prefs?.discord_enabled ? apiCopy.discordEnabled : apiCopy.discordOff,
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={section.title} description={section.description} />
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
