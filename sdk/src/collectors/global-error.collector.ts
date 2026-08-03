import type { Collector, CollectorHost } from "./base";

/** Captures uncaught JavaScript errors via the window `error` event. */
export class GlobalErrorCollector implements Collector {
  private handler?: (event: ErrorEvent) => void;

  constructor(private readonly host: CollectorHost) {}

  start(): void {
    this.handler = (event: ErrorEvent) => {
      const error = event.error;
      if (error instanceof Error) {
        this.host.reportError({
          message: error.message,
          stack: error.stack ?? null,
          type: error.name || "Error",
          level: "error",
        });
        return;
      }
      this.host.reportError({
        message: event.message || "Uncaught error",
        stack: null,
        type: "Error",
        level: "error",
      });
    };
    window.addEventListener("error", this.handler);
  }

  stop(): void {
    if (this.handler) {
      window.removeEventListener("error", this.handler);
    }
  }
}
