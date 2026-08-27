import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { APP_NAME, STATUS_PAGE_BASE_PATH } from "@/lib/constants";
import { env } from "@/lib/env";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getPublicStatusPage } from "@/services/status";
import { createSupabaseAdminClient } from "@/supabase/admin";
import { PublicStatusView } from "@/features/status/components/public-status-view";

export const dynamic = "force-dynamic";

async function loadStatusPage(slug: string) {
  const admin = createSupabaseAdminClient();
  return getPublicStatusPage(admin, slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { dict } = await getDictionary();
  const statusLabel = dict.system.status;
  const t = dict.dash.statusPages;
  const data = await loadStatusPage(slug);
  if (!data) {
    return { title: statusLabel };
  }

  const title = `${data.name} · ${statusLabel}`;
  const description =
    data.description?.trim() ||
    fillTemplate(t.metaFallbackDescription, {
      projectName: data.projectName,
      status: t.componentStatuses[data.currentStatus],
      uptime: data.currentUptime.toFixed(2),
    });
  const url = `${env.NEXT_PUBLIC_APP_URL}${STATUS_PAGE_BASE_PATH}/${data.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: APP_NAME,
      type: "website",
      images: data.logoUrl
        ? [
            {
              url: data.logoUrl,
              alt: fillTemplate(t.logoAlt, { name: data.name }),
            },
          ]
        : undefined,
    },
    twitter: {
      card: data.logoUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: data.logoUrl ? [data.logoUrl] : undefined,
    },
    alternates: { canonical: url },
  };
}

export default async function PublicStatusPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { dict } = await getDictionary();
  const t = dict.dash.statusPages;
  const data = await loadStatusPage(slug);
  if (!data) {
    notFound();
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  const shareUrl = host
    ? `${proto}://${host}${STATUS_PAGE_BASE_PATH}/${data.slug}`
    : `${env.NEXT_PUBLIC_APP_URL}${STATUS_PAGE_BASE_PATH}/${data.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.name,
    description:
      data.description ??
      fillTemplate(t.liveStatusDescription, {
        projectName: data.projectName,
      }),
    url: shareUrl,
    dateModified: data.updatedAt,
    isPartOf: {
      "@type": "WebSite",
      name: APP_NAME,
      url: env.NEXT_PUBLIC_APP_URL,
    },
    about: {
      "@type": "Organization",
      name: data.projectName,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PublicStatusView data={data} shareUrl={shareUrl} />
    </>
  );
}
