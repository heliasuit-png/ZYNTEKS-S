import type { Collector, CollectorHost } from "./base";

/** Captures unhandled promise rejections. */
export class PromiseRejectionCollector implements Collector {
  private handler?: (event: PromiseRejectionEvent) => void;

  constructor(private readonly host: CollectorHost) {}

  start(): void {
    this.handler = (event: PromiseRejectionEvent) => {
      const reason: unknown = event.reason;
      if (reason instanceof Error) {
        this.host.reportError({
          message: reason.message,
          stack: reason.stack ?? null,
          type: reason.name || "UnhandledRejection",
          level: "error",
        });
        return;
      }
      this.host.reportError({
        message:
          typeof reason === "string" ? reason : "Unhandled promise rejection",
        stack: null,
        type: "UnhandledRejection",
        level: "error",
      });
    };
    window.addEventListener("unhandledrejection", this.handler);
  }

  stop(): void {
    if (this.handler) {
      window.removeEventListener("unhandledrejection", this.handler);
    }
  }
}
