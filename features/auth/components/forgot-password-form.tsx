"use client";

import { useActionState } from "react";

import { forgotPasswordAction } from "@/features/auth/actions";
import { initialAuthFormState } from "@/features/auth/types";
import { Field } from "@/features/auth/components/field";
import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialAuthFormState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
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
      <SubmitButton pending={pending} className="w-full">
        Send reset link
      </SubmitButton>
    </form>
  );
}
