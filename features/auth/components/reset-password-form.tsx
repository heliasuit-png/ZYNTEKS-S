"use client";

import { useActionState } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { resetPasswordAction } from "@/features/auth/actions";
import { initialAuthFormState } from "@/features/auth/types";
import { Field } from "@/features/auth/components/field";
import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";

export function ResetPasswordForm() {
  const { dict } = useDictionary();
  const f = dict.authForms;
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialAuthFormState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field
        label={f.newPassword}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.password}
      />
      <Field
        label={f.confirmNewPassword}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton pending={pending} className="w-full">
        {f.updatePassword}
      </SubmitButton>
    </form>
  );
}
