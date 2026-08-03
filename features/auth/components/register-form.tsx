"use client";

import { useActionState } from "react";

import { signUpAction } from "@/features/auth/actions";
import { initialAuthFormState } from "@/features/auth/types";
import { Field } from "@/features/auth/components/field";
import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialAuthFormState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field
        label="Full name"
        name="fullName"
        type="text"
        autoComplete="name"
        placeholder="Ada Lovelace"
        required
        errors={state.fieldErrors?.fullName}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        errors={state.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.password}
      />
      <Field
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton pending={pending} className="w-full">
        Create account
      </SubmitButton>
    </form>
  );
}
