import Link from "next/link";
import type { Metadata } from "next";

import { ROUTES } from "@/lib/constants";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthLegalLinks } from "@/features/auth/components/auth-legal-links";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.auth.forgotTitle };
}

export default async function ForgotPasswordPage() {
  const { dict } = await getDictionary();

  return (
    <AuthCard
      title={dict.auth.forgotTitle}
      description={dict.auth.forgotDesc}
      footer={
        <>
          {dict.auth.rememberedIt}{" "}
          <Link
            href={ROUTES.login}
            className="font-medium text-foreground hover:underline"
          >
            {dict.auth.backToSignIn}
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
      <AuthLegalLinks dict={dict} />
    </AuthCard>
  );
}
