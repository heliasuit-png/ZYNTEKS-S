"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-zt-danger/15 text-zt-danger">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-zt-text">
          Something went wrong
        </h2>
        <p className="max-w-sm text-sm text-zt-muted">
          We couldn&apos;t load this section. Please try again.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
