"use client";

import Link from "next/link";

import { useDictionary } from "@/components/i18n/locale-provider";
import { ADMIN_ROUTES } from "@/lib/constants";

interface AdminErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** Professional error / permission-denied surface for admin routes. */
export function AdminErrorState({
  title,
  message,
  onRetry,
}: AdminErrorStateProps) {
  const { dict } = useDictionary();
  const common = dict.admin.common;
  const resolvedTitle = title ?? common.somethingWrong;
  const resolvedMessage = message ?? dict.admin.errors.viewLoadFailed;
  const permissionDenied =
    /permission|forbidden|access required|insufficient/i.test(resolvedMessage);

  return (
    <div
      className="admin-glass admin-panel mx-auto max-w-lg rounded-2xl p-8 text-center"
      role="alert"
    >
      <p className="admin-eyebrow">
        {permissionDenied ? common.access : common.error}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-[var(--admin-text)]">
        {permissionDenied ? common.permissionDenied : resolvedTitle}
      </h2>
      <p className="mt-2 text-sm text-[var(--admin-muted)]">{resolvedMessage}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="admin-accent-ring rounded-lg bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-white"
          >
            {common.tryAgain}
          </button>
        ) : null}
        <Link
          href={ADMIN_ROUTES.dashboard}
          className="admin-btn-ghost admin-accent-ring inline-flex"
        >
          {common.backToDashboard}
        </Link>
      </div>
    </div>
  );
}
