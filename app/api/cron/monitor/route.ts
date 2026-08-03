import { ok, withErrorHandling } from "@/lib/api-response";
import { UnauthorizedError } from "@/lib/errors";
import { monitorJob } from "@/cron/jobs/monitor";
import { isAuthorizedCronRequest } from "@/cron/auth";
import { trackEvent } from "@/monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron entrypoint for the monitoring job. Runs every minute and is
 * authenticated with the `CRON_SECRET` before executing.
 */
export const GET = withErrorHandling(async (request: Request) => {
  if (!isAuthorizedCronRequest(request)) {
    throw new UnauthorizedError("Invalid cron credentials");
  }

  const result = await monitorJob.run({ invokedAt: new Date().toISOString() });
  trackEvent("cron.monitor", { ok: result.ok });

  return ok(result);
});
