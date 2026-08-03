import type { Collector, CollectorHost } from "./base";
/**
 * Captures resource loading failures (scripts, images, stylesheets). Resource
 * `error` events do not bubble, so a capture-phase listener is required.
 */
export declare class ResourceErrorCollector implements Collector {
    private readonly host;
    private handler?;
    constructor(host: CollectorHost);
    start(): void;
    stop(): void;
}
//# sourceMappingURL=resource.collector.d.ts.map