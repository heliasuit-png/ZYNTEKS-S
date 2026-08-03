import type { Collector, CollectorHost } from "./base";

/**
 * Wraps `fetch` to capture network failures and server (5xx) responses without
 * altering the caller-visible behavior.
 */
export class NetworkErrorCollector implements Collector {
  private original?: typeof window.fetch;

  constructor(private readonly host: CollectorHost) {}

  start(): void {
    if (typeof window === "undefined" || typeof window.fetch !== "function") {
      return;
    }
    const original = window.fetch.bind(window);
    this.original = original;
    const host = this.host;
    const describe = this.describe;

    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      try {
        const response = await original(input, init);
        if (response.status >= 500) {
          host.reportError({
            message: `HTTP ${response.status} on ${describe(input)}`,
            stack: null,
            type: "network",
            level: "error",
          });
        }
        return response;
      } catch (error) {
        host.reportError({
          message: `Network request failed: ${describe(input)}`,
          stack: error instanceof Error ? (error.stack ?? null) : null,
          type: "network",
          level: "error",
        });
        throw error;
      }
    } as typeof window.fetch;
  }

  stop(): void {
    if (this.original) {
      window.fetch = this.original;
    }
  }

  private describe(input: RequestInfo | URL): string {
    if (typeof input === "string") {
      return input;
    }
    if (input instanceof URL) {
      return input.href;
    }
    return input.url;
  }
}
