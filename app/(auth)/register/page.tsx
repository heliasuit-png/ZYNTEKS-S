import Link from "next/link";
import type { Metadata } from "next";

import { ROUTES } from "@/lib/constants";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Start building on ZYNTEKSIS"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={ROUTES.login}
            className="font-medium text-foreground hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
