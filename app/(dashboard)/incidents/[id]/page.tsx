import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { FadeIn } from "@/components/dashboard/motion";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { getIncidentDetail } from "@/services/dashboard/incidents.service";
import { IncidentDetailView } from "@/features/incidents/components/incident-detail-view";
import type { IncidentDetailBundle } from "@/features/incidents/types";

export const metadata: Metadata = { title: "Incident" };

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let bundle: IncidentDetailBundle;
  try {
    bundle = await getIncidentDetail(id);
  } catch (error) {
    if (isAppError(error) && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  const shareUrl = host
    ? `${proto}://${host}${DASHBOARD_ROUTES.incidents}/${id}`
    : `${DASHBOARD_ROUTES.incidents}/${id}`;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href={DASHBOARD_ROUTES.incidents}
          className="inline-flex items-center gap-1.5 text-sm text-zt-muted transition-colors hover:text-zt-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to incidents
        </Link>
        <FadeIn>
          <PageHeader
            title={bundle.incident.title}
            description={bundle.incident.description ?? undefined}
          />
        </FadeIn>
      </div>

      <IncidentDetailView bundle={bundle} shareUrl={shareUrl} />
    </div>
  );
}
