import Link from "next/link";
import type { Metadata } from "next";

import { ROUTES } from "@/lib/constants";
import { AUTH_CALLBACK_ERROR } from "@/lib/auth-callback-errors";
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

function loginErrorMessage(
  error: string | undefined,
  dict: Awaited<ReturnType<typeof getDictionary>>["dict"],
): string | null {
  if (!error) return null;
  switch (error) {
    case AUTH_CALLBACK_ERROR.missing_code:
      return dict.auth.authErrorMissingCode;
    case AUTH_CALLBACK_ERROR.suspended:
      return dict.auth.authErrorSuspended;
    case AUTH_CALLBACK_ERROR.auth_failed:
      return dict.auth.authErrorFailed;
    default:
      return dict.auth.authError;
  }
}

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
  const errorMessage = loginErrorMessage(error, dict);

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
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
        >
          {errorMessage}
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
