import Link from "next/link";
import type { Metadata } from "next";

import { ROUTES } from "@/lib/constants";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthLegalLinks } from "@/features/auth/components/auth-legal-links";
import { AuthMethodPanel } from "@/features/auth/components/auth-method-panel";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getOAuthProviderConfigs } from "@/services/auth/providers";
import { getPlatformRuntimeSettings } from "@/services/platform/runtime-settings.service";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.auth.createAccount };
}

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const platform = await getPlatformRuntimeSettings();
  const providers = await getOAuthProviderConfigs();
  const { dict } = await getDictionary();

  if (!platform.registrationEnabled) {
    return (
      <AuthCard
        title={dict.auth.registrationClosed}
        description={dict.auth.registrationClosedDesc}
        footer={
          <>
            {dict.auth.alreadyHaveAccount}{" "}
            <Link
              href={ROUTES.login}
              className="font-medium text-zt-accent hover:underline"
            >
              {dict.auth.signInLink}
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
      title={dict.auth.createAccount}
      description={dict.auth.createAccountDesc}
      footer={
        <>
          {dict.auth.alreadyHaveAccount}{" "}
          <Link
            href={ROUTES.login}
            className="font-medium text-zt-accent hover:underline"
          >
            {dict.auth.signInLink}
          </Link>
        </>
      }
    >
      <AuthMethodPanel variant="register" providers={providers} />
      <AuthLegalLinks dict={dict} />
    </AuthCard>
  );
}
