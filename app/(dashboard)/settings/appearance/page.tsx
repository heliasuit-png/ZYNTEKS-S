import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { ROUTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAuthenticatedUser } from "@/services/auth";
import { getProfileById } from "@/services/profile";
import { createSupabaseServerClient } from "@/supabase/server";
import { AppearanceSettings } from "@/features/settings/components/appearance-settings";
import { parsePreferences } from "@/features/settings/lib/preferences";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.dashboard.settingsSections.appearance.title };
}

export default async function AppearanceSettingsPage() {
  const { dict } = await getDictionary();
  const section = dict.dashboard.settingsSections.appearance;
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect(ROUTES.login);

  const profile = await getProfileById(supabase, user.id);
  const { appearance } = parsePreferences(profile.preferences);

  return (
    <div className="space-y-6">
      <PageHeader title={section.title} description={section.description} />
      <AppearanceSettings preferences={appearance} />
    </div>
  );
}
