import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";

import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import {
  APP_NAME,
  STATUS_PAGE_BASE_PATH,
  type ComponentStatusValue,
} from "@/lib/constants";
import { env } from "@/lib/env";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { listPublicStatusDirectory } from "@/services/status";
import { createSupabaseAdminClient } from "@/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  const title = dict.system.status;
  const description = fillTemplate(
    dict.dash.statusPages.directoryMetaDescription,
    { app: APP_NAME },
  );
  return {
    title,
    description,
    openGraph: {
      title: `${title} · ${APP_NAME}`,
      description,
      url: `${env.NEXT_PUBLIC_APP_URL}${STATUS_PAGE_BASE_PATH}`,
      siteName: APP_NAME,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${title} · ${APP_NAME}`,
      description,
    },
  };
}

const tone: Record<ComponentStatusValue, BadgeProps["tone"]> = {
  operational: "success",
  degraded: "warning",
  partial_outage: "warning",
  major_outage: "danger",
  maintenance: "primary",
};

export default async function StatusDirectoryPage() {
  const { dict } = await getDictionary();
  const t = dict.dash.statusPages;
  const admin = createSupabaseAdminClient();
  const pages = await listPublicStatusDirectory(admin);

  return (
    <main className="min-h-screen bg-zt-bg text-zt-text">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-zt-muted">
            {APP_NAME}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {dict.system.status}
          </h1>
          <p className="mt-2 text-sm text-zt-muted">{t.directoryDescription}</p>
        </header>

        {pages.length === 0 ? (
          <div className="rounded-2xl border border-zt-border bg-zt-surface px-5 py-10 text-center">
            <Activity className="mx-auto size-8 text-zt-muted" aria-hidden />
            <p className="mt-3 text-sm text-zt-muted">{t.directoryEmpty}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {pages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`${STATUS_PAGE_BASE_PATH}/${page.slug}`}
                  className="block rounded-2xl border border-zt-border bg-zt-surface px-5 py-4 transition-colors hover:border-zt-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zt-primary/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zt-text">
                        {page.name}
                      </p>
                      <p className="text-xs text-zt-muted">{page.projectName}</p>
                      {page.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-zt-muted">
                          {page.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={tone[page.currentStatus]}>
                        {t.componentStatuses[page.currentStatus]}
                      </Badge>
                      <span className="text-xs tabular-nums text-zt-muted">
                        {fillTemplate(t.uptimePercentLabel, {
                          percent: page.currentUptime.toFixed(2),
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
