"use client";

import { useEffect } from "react";

import { AdminContainer } from "@/features/admin/components/admin-container";
import { AdminErrorState } from "@/features/admin/components/ui/admin-error-state";

export function AdminRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin-route]", error);
  }, [error]);

  return (
    <AdminContainer className="flex min-h-[40vh] items-center justify-center py-12">
      <AdminErrorState message={error.message} onRetry={reset} />
    </AdminContainer>
  );
}
