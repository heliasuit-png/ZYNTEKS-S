import type { PayloadKind } from "../types";

export const ENDPOINT_PATHS: Record<PayloadKind, string> = {
  error: "/api/sdk/error",
  heartbeat: "/api/sdk/heartbeat",
  performance: "/api/sdk/performance",
  events: "/api/sdk/events",
};

/** Resolves the absolute (or same-origin relative) ingestion URL. */
export function resolveUrl(base: string, kind: PayloadKind): string {
  const path = ENDPOINT_PATHS[kind];
  if (!base) {
    return path;
  }
  return `${base.replace(/\/+$/, "")}${path}`;
}
