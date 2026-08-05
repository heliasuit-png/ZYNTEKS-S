"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";

import { adminSignInAction } from "@/features/admin/actions";
import { initialAdminFormState } from "@/features/admin/types";

export function AdminLoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(
    adminSignInAction,
    initialAdminFormState,
  );

  return (
    <motion.form
      action={formAction}
      noValidate
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="admin-glass admin-panel w-full max-w-md space-y-5 rounded-2xl p-8"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--admin-text)]">
          Admin sign in
        </h1>
        <p className="text-sm text-[var(--admin-muted)]">
          Enterprise Admin Control Center. Authorized administrators only.
        </p>
      </div>

      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="rounded-lg border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-sm text-[var(--admin-danger)]"
        >
          {state.message}
        </div>
      ) : null}

      {redirectTo ? (
        <input type="hidden" name="redirect" value={redirectTo} />
      ) : null}

      <label className="block space-y-1.5 text-sm">
        <span className="text-[var(--admin-muted)]">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="admin-accent-ring w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2.5 text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
          placeholder="admin@your-company.com"
        />
        {state.fieldErrors?.email?.[0] ? (
          <span className="block text-xs text-[var(--admin-danger)]">
            {state.fieldErrors.email[0]}
          </span>
        ) : null}
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="text-[var(--admin-muted)]">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="admin-accent-ring w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2.5 text-[var(--admin-text)] outline-none"
        />
        {state.fieldErrors?.password?.[0] ? (
          <span className="block text-xs text-[var(--admin-danger)]">
            {state.fieldErrors.password[0]}
          </span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="admin-accent-ring w-full rounded-xl bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in to Admin"}
      </button>
    </motion.form>
  );
}
