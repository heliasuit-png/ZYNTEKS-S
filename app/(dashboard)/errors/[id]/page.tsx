import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";

import { PageHeader } from "@/components/dashboard/page-header";
import { FadeIn } from "@/components/dashboard/motion";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { getErrorDetail } from "@/services/dashboard/errors.service";
import { ErrorDetailView } from "@/features/errors/components/error-detail-view";
import type { ErrorDetailBundle } from "@/features/errors/types";

export const metadata: Metadata = { title: "Error Details" };

export default async function ErrorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let bundle: ErrorDetailBundle;
  try {
    bundle = await getErrorDetail(id);
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
    ? `${proto}://${host}${DASHBOARD_ROUTES.errors}/${id}`
    : `${DASHBOARD_ROUTES.errors}/${id}`;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href={DASHBOARD_ROUTES.errors}
          className="inline-flex items-center gap-1.5 text-sm text-zt-muted transition-colors hover:text-zt-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to errors
        </Link>
        <FadeIn>
          <PageHeader
            title={bundle.error.message}
            description={`${bundle.error.projectName} · fingerprint ${bundle.error.fingerprint.slice(0, 12)}…`}
          />
        </FadeIn>
      </div>

      <ErrorDetailView bundle={bundle} shareUrl={shareUrl} />
    </div>
  );
}
