import type { Collector, CollectorHost } from "./base";
/** Emits a heartbeat immediately after startup and then on a fixed interval. */
export declare class HeartbeatCollector implements Collector {
    private readonly host;
    private interval?;
    private initial?;
    constructor(host: CollectorHost);
    start(): void;
    stop(): void;
}
//# sourceMappingURL=heartbeat.collector.d.ts.map