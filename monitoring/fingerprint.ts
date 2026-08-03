import "server-only";

import { createHash } from "node:crypto";

/**
 * Computes a stable fingerprint for error deduplication from message, stack,
 * and URL. The ingest layer collapses identical fingerprints into one error
 * group (see `monitoring/ingest.service.ts`) so repeated client crashes do not
 * create unbounded rows.
 */
export function computeFingerprint(
  message: string,
  stack: string | null,
  url: string | null,
): string {
  const normalized = `${message}\n${stack ?? ""}\n${url ?? ""}`;
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

/** Normalizes a client-supplied timestamp to an ISO string, or a fallback. */
export function normalizeTimestamp(
  value: string | number | undefined,
  fallbackIso: string,
): string {
  if (value === undefined) {
    return fallbackIso;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallbackIso : date.toISOString();
}
