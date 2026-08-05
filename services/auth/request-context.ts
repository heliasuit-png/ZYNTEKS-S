import "server-only";

import { headers } from "next/headers";

/** Best-effort client context for auth telemetry (IP, UA, geo). */
export async function getAuthRequestContext(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
}> {
  const headerStore = await headers();
  return {
    ipAddress:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      null,
    userAgent: headerStore.get("user-agent"),
    country: headerStore.get("x-vercel-ip-country"),
  };
}
