import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { ROUTES } from "@/lib/constants";
import { aiConfig } from "@/ai/config";
import { getAuthenticatedUser } from "@/services/auth";
import { getSubscriptionPlan } from "@/services/account/plan.service";
import { getUsageSummary, listConversations } from "@/services/ai";
import { getProfileById } from "@/services/profile";
import { createSupabaseServerClient } from "@/supabase/server";
import { AiSettingsPanel } from "@/features/settings/components/ai-settings";
import { parsePreferences } from "@/features/settings/lib/preferences";

export const metadata: Metadata = { title: "AI Settings" };

export default async function AiSettingsPage() {
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
      <PageHeader
        title="AI settings"
        description="Usage, conversation history, default model and streaming."
      />
      <AiSettingsPanel
        usage={usage}
        preferences={ai}
        envModel={aiConfig.defaultModel}
        conversationCount={conversations.length}
      />
    </div>
  );
}
