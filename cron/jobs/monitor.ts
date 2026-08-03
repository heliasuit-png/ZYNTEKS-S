import { createSupabaseAdminClient } from "@/supabase/admin";
import { processQueue } from "@/services/notifications";
import { runMonitoringPass, scanNotifiableEvents } from "@/services/monitoring";
import type { CronJob } from "@/cron/types";

/**
 * Monitoring job. Runs every minute: detects heartbeat outages, auto-resolves
 * recovered incidents, raises transactional notifications for recent events,
 * and flushes the notification delivery queue.
 */
export const monitorJob: CronJob = {
  name: "monitor",
  schedule: "* * * * *",
  path: "/api/cron/monitor",
  run: async ({ invokedAt }) => {
    const admin = createSupabaseAdminClient();

    const monitoring = await runMonitoringPass(admin);
    const events = await scanNotifiableEvents(admin);
    const queue = await processQueue(admin);

    return {
      ok: true,
      message: "monitoring pass complete",
      data: { invokedAt, monitoring, events, queue },
    };
  },
};
