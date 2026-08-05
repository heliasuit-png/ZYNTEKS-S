import Link from "next/link";
import type { Metadata } from "next";

import { ROUTES } from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-redirect";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthMethodPanel } from "@/features/auth/components/auth-method-panel";
import { getOAuthProviderConfigs } from "@/services/auth/providers";

export const metadata: Metadata = {
  title: "Sign in",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    reset?: string;
    redirect?: string;
    error?: string;
  }>;
}) {
  const {
    reset,
    redirect: redirectParam,
    error,
  } = await searchParams;
  const redirectTo = safeNextPath(redirectParam, "");
  const providers = getOAuthProviderConfigs();

  return (
    <AuthCard
      title="Welcome back"
      description="Enterprise access to your ZYNTEKSIS workspace"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href={ROUTES.register}
            className="font-medium text-zt-accent hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      {reset === "success" ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
        >
          Your password has been updated. Sign in with your new password.
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
        >
          Authentication could not be completed. Please try again.
        </p>
      ) : null}
      <AuthMethodPanel
        variant="login"
        providers={providers}
        redirectTo={redirectTo || undefined}
      />
    </AuthCard>
  );
}
