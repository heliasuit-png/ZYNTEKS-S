"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/dashboard/button";
import type { ButtonProps } from "@/components/dashboard/button";
import {
  initialBillingActionState,
  type BillingActionState,
} from "@/features/billing/types";

type BillingServerAction = (
  prev: BillingActionState,
  formData: FormData,
) => Promise<BillingActionState>;

/**
 * Shared button for Upgrade / Purchase / Manage / Change Plan.
 * Results come only from BillingService → PaymentProvider (placeholder until wired).
 */
export function BillingActionButton({
  action,
  label,
  pendingLabel,
  variant = "primary",
  size = "md",
  className,
  children,
  hiddenFields,
  onResult,
}: {
  action: BillingServerAction;
  label: string;
  pendingLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  children?: React.ReactNode;
  hiddenFields?: Record<string, string>;
  onResult?: (state: BillingActionState) => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    action,
    initialBillingActionState,
  );

  useEffect(() => {
    if (state.status === "idle") return;
    onResult?.(state);
    if (state.status === "ok" && state.redirectUrl) {
      window.location.assign(state.redirectUrl);
    }
  }, [state, onResult, router]);

  return (
    <form action={formAction} className={className}>
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <Button type="submit" variant={variant} size={size} disabled={pending}>
        {children}
        {pending ? pendingLabel ?? "Working…" : label}
      </Button>
    </form>
  );
}

export function BillingActionMessage({ state }: { state: BillingActionState }) {
  if (state.status === "idle" || !state.message) return null;

  const tone =
    state.status === "not_configured"
      ? "border-zt-warning/40 bg-zt-warning/10 text-zt-warning"
      : state.status === "ok"
        ? "border-zt-success/40 bg-zt-success/10 text-zt-success"
        : "border-zt-danger/40 bg-zt-danger/10 text-zt-danger";

  return (
    <div
      role="status"
      className={`rounded-xl border px-4 py-3 text-sm ${tone}`}
    >
      <p className="font-medium">
        {state.status === "not_configured"
          ? "Payment provider not connected"
          : state.status === "ok"
            ? "Ready"
            : "Billing action"}
      </p>
      <p className="mt-1 opacity-90">{state.message}</p>
      {state.providerId ? (
        <p className="mt-2 text-xs opacity-70">Provider: {state.providerId}</p>
      ) : null}
    </div>
  );
}
