import type { MetadataRoute } from "next";

import { STATUS_PAGE_BASE_PATH } from "@/lib/constants";
import { env } from "@/lib/env";
import { listPublicStatusSlugs } from "@/services/status";
import { createSupabaseAdminClient } from "@/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/docs`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/legal/cookie`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/legal/kvkk`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${base}${STATUS_PAGE_BASE_PATH}`,
      changeFrequency: "hourly",
      priority: 0.8,
    },
  ];

  try {
    const admin = createSupabaseAdminClient();
    const slugs = await listPublicStatusSlugs(admin);
    for (const slug of slugs) {
      entries.push({
        url: `${base}${STATUS_PAGE_BASE_PATH}/${slug}`,
        changeFrequency: "hourly",
        priority: 0.7,
      });
    }
  } catch {
    // Sitemap still returns core routes if status lookup fails.
  }

  return entries;
}
