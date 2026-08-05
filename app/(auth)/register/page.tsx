import Link from "next/link";
import type { Metadata } from "next";

import { ROUTES } from "@/lib/constants";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthMethodPanel } from "@/features/auth/components/auth-method-panel";
import { getOAuthProviderConfigs } from "@/services/auth/providers";
import { getPlatformRuntimeSettings } from "@/services/platform/runtime-settings.service";

export const metadata: Metadata = {
  title: "Create account",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const platform = await getPlatformRuntimeSettings();
  const providers = await getOAuthProviderConfigs();

  if (!platform.registrationEnabled) {
    return (
      <AuthCard
        title="Registration closed"
        description="New accounts are not being accepted right now."
        footer={
          <>
            Already have an account?{" "}
            <Link
              href={ROUTES.login}
              className="font-medium text-zt-accent hover:underline"
            >
              Sign in
            </Link>
          </>
        }
      >
        <p className="text-sm text-zt-muted">
          Contact your platform administrator if you need access.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      description="Join ZYNTEKSIS with SSO or email — one identity, no duplicates"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={ROUTES.login}
            className="font-medium text-zt-accent hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <AuthMethodPanel variant="register" providers={providers} />
    </AuthCard>
  );
}
