import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/pricing",
        "/docs",
        "/privacy",
        "/terms",
        "/contact",
        "/status",
        "/status/",
      ],
      disallow: [
        "/dashboard",
        "/api/",
        "/login",
        "/register",
        "/settings",
        "/billing",
        "/status-pages",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
