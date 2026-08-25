import type { CronJob } from "@/cron/types";

/**
 * Heartbeat job. Confirms the scheduled execution pipeline is healthy and
 * provides a lightweight liveness signal for monitoring.
 */
export const healthJob: CronJob = {
  name: "health",
  // Hobby: once daily. Pro can restore "*/15 * * * *" in vercel.json.
  schedule: "0 0 * * *",
  path: "/api/cron/health",
  run: async ({ invokedAt }) => ({
    ok: true,
    message: "heartbeat",
    data: { invokedAt },
  }),
};
