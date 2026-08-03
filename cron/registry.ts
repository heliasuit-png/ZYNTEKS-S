import { healthJob } from "@/cron/jobs/health";
import { monitorJob } from "@/cron/jobs/monitor";
import type { CronJob } from "@/cron/types";

/**
 * Central registry of all scheduled jobs. Every entry must have a matching
 * `crons` definition in `vercel.json`.
 */
export const cronJobs: readonly CronJob[] = [healthJob, monitorJob];

export function getCronJob(name: string): CronJob | undefined {
  return cronJobs.find((job) => job.name === name);
}
