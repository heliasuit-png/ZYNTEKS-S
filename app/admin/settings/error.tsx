"use client";

import { AdminRouteError } from "@/features/admin/components/ui/admin-route-error";

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AdminRouteError {...props} />;
}
