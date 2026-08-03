import type { Collector, CollectorHost } from "./base";
/** Captures unhandled promise rejections. */
export declare class PromiseRejectionCollector implements Collector {
    private readonly host;
    private handler?;
    constructor(host: CollectorHost);
    start(): void;
    stop(): void;
}
//# sourceMappingURL=promise-rejection.collector.d.ts.map