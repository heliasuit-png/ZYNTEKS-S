import type { Collector, CollectorHost } from "./base";

const INITIAL_DELAY_MS = 1000;

/** Emits a heartbeat immediately after startup and then on a fixed interval. */
export class HeartbeatCollector implements Collector {
  private interval?: ReturnType<typeof setInterval>;
  private initial?: ReturnType<typeof setTimeout>;

  constructor(private readonly host: CollectorHost) {}

  start(): void {
    this.initial = setTimeout(() => {
      this.host.reportHeartbeat();
    }, INITIAL_DELAY_MS);

    this.interval = setInterval(() => {
      this.host.reportHeartbeat();
    }, this.host.config.heartbeatInterval);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.initial) {
      clearTimeout(this.initial);
    }
  }
}
