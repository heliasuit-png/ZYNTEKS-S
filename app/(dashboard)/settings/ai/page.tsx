import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { ROUTES } from "@/lib/constants";
import { aiConfig } from "@/ai/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAuthenticatedUser } from "@/services/auth";
import { getSubscriptionPlan } from "@/services/account/plan.service";
import { getUsageSummary, listConversations } from "@/services/ai";
import { getProfileById } from "@/services/profile";
import { createSupabaseServerClient } from "@/supabase/server";
import { AiSettingsPanel } from "@/features/settings/components/ai-settings";
import { parsePreferences } from "@/features/settings/lib/preferences";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.dashboard.settingsSections.ai.title };
}

export default async function AiSettingsPage() {
  const { dict } = await getDictionary();
  const section = dict.dashboard.settingsSections.ai;
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect(ROUTES.login);

  const [profile, plan, conversations] = await Promise.all([
    getProfileById(supabase, user.id),
    getSubscriptionPlan(supabase, user.id),
    listConversations(supabase, user.id),
  ]);
  const usage = await getUsageSummary(supabase, user.id, plan);
  const { ai } = parsePreferences(profile.preferences);

  return (
    <div className="space-y-6">
      <PageHeader title={section.title} description={section.description} />
      <AiSettingsPanel
        usage={usage}
        preferences={ai}
        envModel={aiConfig.defaultModel}
        conversationCount={conversations.length}
      />
    </div>
  );
}
