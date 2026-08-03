import { logger } from "@/lib/logger";
import { toAppError } from "@/lib/errors";
import type { LogContext } from "@/lib/logger";

/**
 * Observability abstraction.
 *
 * Provides a stable surface for capturing errors and tracking events. It is
 * backed by the structured logger today and can be wired to an external
 * provider (Sentry, Datadog, ...) without changing any call sites.
 */

export function captureException(error: unknown, context?: LogContext): void {
  const appError = toAppError(error);
  logger.error(appError.message, appError, {
    code: appError.code,
    ...context,
  });
}

export function trackEvent(name: string, properties?: LogContext): void {
  logger.info(`event:${name}`, properties);
}

/**
 * Measures the duration of an async operation and reports it as an event.
 */
export async function measure<T>(
  name: string,
  operation: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await operation();
    trackEvent(name, { durationMs: Date.now() - start, status: "success" });
    return result;
  } catch (error) {
    trackEvent(name, { durationMs: Date.now() - start, status: "error" });
    captureException(error, { operation: name });
    throw error;
  }
}
