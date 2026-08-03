import Link from "next/link";
import { Bug } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { DASHBOARD_ROUTES } from "@/lib/constants";

export default function ErrorNotFound() {
  return (
    <div className="py-16">
      <EmptyState
        icon={Bug}
        title="Error not found"
        description="This error group may have been removed or you don’t have access."
        action={
          <Link
            href={DASHBOARD_ROUTES.errors}
            className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
          >
            Back to Error Monitoring
          </Link>
        }
      />
    </div>
  );
}
