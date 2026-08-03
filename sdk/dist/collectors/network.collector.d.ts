import type { Collector, CollectorHost } from "./base";
/**
 * Wraps `fetch` to capture network failures and server (5xx) responses without
 * altering the caller-visible behavior.
 */
export declare class NetworkErrorCollector implements Collector {
    private readonly host;
    private original?;
    constructor(host: CollectorHost);
    start(): void;
    stop(): void;
    private describe;
}
//# sourceMappingURL=network.collector.d.ts.map