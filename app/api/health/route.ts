import { ok, withErrorHandling } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness probe. Returns a lightweight status payload used by uptime checks
 * and load balancers.
 */
export const GET = withErrorHandling(async () => {
  return ok({
    status: "ok",
    service: "zynteksis",
    timestamp: new Date().toISOString(),
  });
});
