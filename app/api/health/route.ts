import { ok, withErrorHandling } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness probe. Returns a lightweight status payload used by uptime checks
 * and load balancers.
 */
export const GET = withErrorHandling(async () => {
  // Host-only diagnostic for staging boot checks (never returns secrets).
  let supabaseHost: string | null = null;
  try {
    supabaseHost = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    ).hostname.toLowerCase();
  } catch {
    supabaseHost = null;
  }

  return ok({
    status: "ok",
    service: "zynteksis",
    timestamp: new Date().toISOString(),
    supabaseHost,
  });
});
