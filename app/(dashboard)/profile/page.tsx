import { redirect } from "next/navigation";
import { dashboardPageMetadata } from "@/lib/i18n/dashboard-metadata";
import { getDictionary } from "@/lib/i18n/get-dictionary";

import { PageHeader } from "@/components/dashboard/page-header";
import { ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { getProfileById } from "@/services/profile";
import type { Profile } from "@/services/profile";
import { createSupabaseServerClient } from "@/supabase/server";
import { ProfileSettings } from "@/features/settings/components/profile-settings";

export const generateMetadata = () => dashboardPageMetadata("profile");

export default async function ProfilePage() {
  const { dict } = await getDictionary();
  const pageCopy = dict.dashboard.pageTitles.profile;
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(ROUTES.login);
  }

  let profile: Profile | null = null;
  try {
    profile = await getProfileById(supabase, user.id);
  } catch {
    profile = null;
  }

  if (!profile) {
    redirect(ROUTES.login);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={pageCopy.title} description={pageCopy.description}
      />
      <ProfileSettings
        profile={profile}
        emailVerified={Boolean(user.email_confirmed_at)}
      />
    </div>
  );
}
