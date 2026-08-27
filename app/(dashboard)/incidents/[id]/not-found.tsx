import Link from "next/link";
import { Siren } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function IncidentNotFound() {
  const { dict } = await getDictionary();
  const t = dict.dash.incidents;

  return (
    <div className="py-16">
      <EmptyState
        icon={Siren}
        title={t.notFoundTitle}
        description={t.notFoundDesc}
        action={
          <Link
            href={DASHBOARD_ROUTES.incidents}
            className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
          >
            {t.backToList}
          </Link>
        }
      />
    </div>
  );
}
