"use client";

import { useActionState } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { signUpAction } from "@/features/auth/actions";
import { initialAuthFormState } from "@/features/auth/types";
import { Field } from "@/features/auth/components/field";
import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";

export function RegisterForm() {
  const { dict } = useDictionary();
  const f = dict.authForms;
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialAuthFormState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field
        label={f.fullName}
        name="fullName"
        type="text"
        autoComplete="name"
        placeholder={f.fullNamePlaceholder}
        required
        errors={state.fieldErrors?.fullName}
      />
      <Field
        label={f.email}
        name="email"
        type="email"
        autoComplete="email"
        placeholder={f.emailCompanyPlaceholder}
        required
        errors={state.fieldErrors?.email}
      />
      <Field
        label={f.password}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.password}
      />
      <Field
        label={f.confirmPassword}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton pending={pending} className="w-full">
        {f.createAccount}
      </SubmitButton>
    </form>
  );
}
