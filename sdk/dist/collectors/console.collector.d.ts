import type { Collector, CollectorHost } from "./base";
/** Captures `console.error` calls while preserving the original behavior. */
export declare class ConsoleCollector implements Collector {
    private readonly host;
    private original?;
    private capturing;
    constructor(host: CollectorHost);
    start(): void;
    stop(): void;
    private stringify;
}
//# sourceMappingURL=console.collector.d.ts.map