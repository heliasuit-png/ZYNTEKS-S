import { ok, withErrorHandling } from "@/lib/api-response";
import { UnauthorizedError } from "@/lib/errors";
import { healthJob } from "@/cron/jobs/health";
import { isAuthorizedCronRequest } from "@/cron/auth";
import { trackEvent } from "@/monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron entrypoint for the health heartbeat job. Requests are
 * authenticated with the `CRON_SECRET` before the job is executed.
 */
export const GET = withErrorHandling(async (request: Request) => {
  if (!isAuthorizedCronRequest(request)) {
    throw new UnauthorizedError("Invalid cron credentials");
  }

  const result = await healthJob.run({ invokedAt: new Date().toISOString() });
  trackEvent("cron.health", { ok: result.ok });

  return ok(result);
});
