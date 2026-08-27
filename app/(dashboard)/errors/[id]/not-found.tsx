import Link from "next/link";
import { Bug } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function ErrorNotFound() {
  const { dict } = await getDictionary();
  const t = dict.dash.errors;

  return (
    <div className="py-16">
      <EmptyState
        icon={Bug}
        title={t.notFoundTitle}
        description={t.notFoundDesc}
        action={
          <Link
            href={DASHBOARD_ROUTES.errors}
            className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
          >
            {t.backToList}
          </Link>
        }
      />
    </div>
  );
}
