import type { Collector, CollectorHost } from "./base";

/** Captures `console.error` calls while preserving the original behavior. */
export class ConsoleCollector implements Collector {
  private original?: (...data: unknown[]) => void;
  private capturing = false;

  constructor(private readonly host: CollectorHost) {}

  start(): void {
    if (typeof console === "undefined") {
      return;
    }
    const original = console.error.bind(console) as (
      ...data: unknown[]
    ) => void;
    this.original = original;

    const collector = this;
    console.error = function patchedConsoleError(...args: unknown[]): void {
      original(...args);
      if (collector.capturing) {
        return;
      }
      collector.capturing = true;
      try {
        const message = args.map((arg) => collector.stringify(arg)).join(" ");
        const errorArg = args.find((arg) => arg instanceof Error) as
          | Error
          | undefined;
        collector.host.reportError({
          message: message || "console.error",
          stack: errorArg?.stack ?? null,
          type: "console.error",
          level: "error",
        });
      } finally {
        collector.capturing = false;
      }
    };
  }

  stop(): void {
    if (this.original) {
      console.error = this.original;
    }
  }

  private stringify(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }
    if (value instanceof Error) {
      return value.message;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
