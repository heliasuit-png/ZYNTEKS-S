import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { getProfileById } from "@/services/profile";
import type { Profile } from "@/services/profile";
import { createSupabaseServerClient } from "@/supabase/server";
import { ProfileSettings } from "@/features/settings/components/profile-settings";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
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
      <PageHeader
        title="Profile"
        description="Manage your personal account, password and verification."
      />
      <ProfileSettings
        profile={profile}
        emailVerified={Boolean(user.email_confirmed_at)}
      />
    </div>
  );
}
