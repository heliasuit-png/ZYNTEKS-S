import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { getProfileById } from "@/services/profile";
import { createSupabaseServerClient } from "@/supabase/server";
import { AppearanceSettings } from "@/features/settings/components/appearance-settings";
import { parsePreferences } from "@/features/settings/lib/preferences";

export const metadata: Metadata = { title: "Appearance" };

export default async function AppearanceSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect(ROUTES.login);

  const profile = await getProfileById(supabase, user.id);
  const { appearance } = parsePreferences(profile.preferences);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appearance"
        description="Theme, accent color, reduced motion, sidebar style and density."
      />
      <AppearanceSettings preferences={appearance} />
    </div>
  );
}
