"use client";

import { useActionState } from "react";

import { magicLinkAction } from "@/features/auth/actions";
import { initialAuthFormState } from "@/features/auth/types";
import { Field } from "@/features/auth/components/field";
import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";

export function MagicLinkForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(
    magicLinkAction,
    initialAuthFormState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {redirectTo ? (
        <input type="hidden" name="redirect" value={redirectTo} />
      ) : null}
      <FormMessage state={state} />
      <Field
        label="Work email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        required
        errors={state.fieldErrors?.email}
      />
      <SubmitButton pending={pending} className="w-full" variant="secondary">
        Continue with Email
      </SubmitButton>
      <p className="text-center text-[11px] text-zt-muted">
        We&apos;ll email a one-time magic link. No password required.
      </p>
    </form>
  );
}
