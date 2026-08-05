"use client";

import Link from "next/link";

import { ADMIN_ROUTES } from "@/lib/constants";

interface AdminErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** Professional error / permission-denied surface for admin routes. */
export function AdminErrorState({
  title = "Something went wrong",
  message = "This admin view could not be loaded. Try again or return to the dashboard.",
  onRetry,
}: AdminErrorStateProps) {
  const permissionDenied =
    /permission|forbidden|access required|insufficient/i.test(message);

  return (
    <div
      className="admin-glass admin-panel mx-auto max-w-lg rounded-2xl p-8 text-center"
      role="alert"
    >
      <p className="admin-eyebrow">
        {permissionDenied ? "Access" : "Error"}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-[var(--admin-text)]">
        {permissionDenied ? "Permission denied" : title}
      </h2>
      <p className="mt-2 text-sm text-[var(--admin-muted)]">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="admin-accent-ring rounded-lg bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        ) : null}
        <Link
          href={ADMIN_ROUTES.dashboard}
          className="admin-btn-ghost admin-accent-ring inline-flex"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
