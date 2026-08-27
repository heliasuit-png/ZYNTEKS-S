import Link from "next/link";
import type { Metadata } from "next";

import { ROUTES } from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-redirect";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthLegalLinks } from "@/features/auth/components/auth-legal-links";
import { AuthMethodPanel } from "@/features/auth/components/auth-method-panel";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getOAuthProviderConfigs } from "@/services/auth/providers";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.auth.loginTitle };
}

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    reset?: string;
    redirect?: string;
    error?: string;
    signedOut?: string;
  }>;
}) {
  const {
    reset,
    redirect: redirectParam,
    error,
    signedOut,
  } = await searchParams;
  const redirectTo = safeNextPath(redirectParam, "");
  const providers = await getOAuthProviderConfigs();
  const { dict } = await getDictionary();

  return (
    <AuthCard
      title={dict.auth.welcomeBack}
      description={dict.auth.welcomeBackDesc}
      footer={
        <>
          {dict.auth.noAccount}{" "}
          <Link
            href={ROUTES.register}
            className="font-medium text-zt-accent hover:underline"
          >
            {dict.auth.createOne}
          </Link>
        </>
      }
    >
      {signedOut === "1" ? (
        <p
          role="status"
          className="rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-muted"
        >
          {dict.auth.signedOut}
        </p>
      ) : null}
      {reset === "success" ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
        >
          {dict.auth.passwordUpdated}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
        >
          {dict.auth.authError}
        </p>
      ) : null}
      <AuthMethodPanel
        variant="login"
        providers={providers}
        redirectTo={redirectTo || undefined}
      />
      <AuthLegalLinks dict={dict} />
    </AuthCard>
  );
}
