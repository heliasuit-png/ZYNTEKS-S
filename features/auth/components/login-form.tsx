"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ROUTES } from "@/lib/constants";
import { signInAction } from "@/features/auth/actions";
import { initialAuthFormState } from "@/features/auth/types";
import { Field } from "@/features/auth/components/field";
import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialAuthFormState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {redirectTo ? (
        <input type="hidden" name="redirect" value={redirectTo} />
      ) : null}
      <FormMessage state={state} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        errors={state.fieldErrors?.email}
      />
      <div className="space-y-1.5">
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          errors={state.fieldErrors?.password}
        />
        <div className="text-right">
          <Link
            href={ROUTES.forgotPassword}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>
      </div>
      <SubmitButton pending={pending} className="w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
