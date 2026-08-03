/**
 * Types describing scheduled jobs executed by Vercel Cron.
 */

export interface CronJobContext {
  /** ISO timestamp of when the job started executing. */
  invokedAt: string;
}

export interface CronJobResult {
  ok: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export interface CronJob {
  /** Unique job identifier. */
  name: string;
  /** Cron expression, kept in sync with `vercel.json`. */
  schedule: string;
  /** Route handler path that Vercel Cron invokes. */
  path: string;
  /** The work performed when the job runs. */
  run: (context: CronJobContext) => Promise<CronJobResult>;
}
