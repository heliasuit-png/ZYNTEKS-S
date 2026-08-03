import Link from "next/link";
import type { Metadata } from "next";

import { ROUTES } from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-redirect";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; redirect?: string }>;
}) {
  const { reset, redirect: redirectParam } = await searchParams;
  // Preserve deep-link targets from middleware (`?redirect=`), rejecting open redirects.
  const redirectTo = safeNextPath(redirectParam, "");

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your ZYNTEKSIS account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href={ROUTES.register}
            className="font-medium text-foreground hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      {reset === "success" ? (
        <p
          role="status"
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600"
        >
          Your password has been updated. Sign in with your new password.
        </p>
      ) : null}
      <LoginForm redirectTo={redirectTo || undefined} />
    </AuthCard>
  );
}
