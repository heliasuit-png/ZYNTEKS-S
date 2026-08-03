import type { CronJob } from "@/cron/types";

/**
 * Heartbeat job. Confirms the scheduled execution pipeline is healthy and
 * provides a lightweight liveness signal for monitoring.
 */
export const healthJob: CronJob = {
  name: "health",
  schedule: "*/15 * * * *",
  path: "/api/cron/health",
  run: async ({ invokedAt }) => ({
    ok: true,
    message: "heartbeat",
    data: { invokedAt },
  }),
};
