import Link from "next/link";
import { Siren } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { DASHBOARD_ROUTES } from "@/lib/constants";

export default function IncidentNotFound() {
  return (
    <div className="py-16">
      <EmptyState
        icon={Siren}
        title="Incident not found"
        description="This incident may have been removed or you don’t have access."
        action={
          <Link
            href={DASHBOARD_ROUTES.incidents}
            className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
          >
            Back to Incidents
          </Link>
        }
      />
    </div>
  );
}
