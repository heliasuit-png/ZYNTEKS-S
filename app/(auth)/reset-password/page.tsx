import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthLegalLinks } from "@/features/auth/components/auth-legal-links";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.auth.resetTitle };
}

export default async function ResetPasswordPage() {
  const { dict } = await getDictionary();

  return (
    <AuthCard title={dict.auth.resetTitle} description={dict.auth.resetDesc}>
      <ResetPasswordForm />
      <AuthLegalLinks dict={dict} />
    </AuthCard>
  );
}
