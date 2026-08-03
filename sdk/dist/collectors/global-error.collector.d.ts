import type { Collector, CollectorHost } from "./base";
/** Captures uncaught JavaScript errors via the window `error` event. */
export declare class GlobalErrorCollector implements Collector {
    private readonly host;
    private handler?;
    constructor(host: CollectorHost);
    start(): void;
    stop(): void;
}
//# sourceMappingURL=global-error.collector.d.ts.map