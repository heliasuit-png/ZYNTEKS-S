import type { Collector, CollectorHost } from "./base";
/**
 * Attaches an error interceptor to an axios instance when one is available
 * (either via config or a global). No-op if axios is not present.
 */
export declare class AxiosErrorCollector implements Collector {
    private readonly host;
    private axiosRef?;
    private interceptorId?;
    constructor(host: CollectorHost);
    start(): void;
    stop(): void;
    private detectGlobal;
    private report;
}
//# sourceMappingURL=axios.collector.d.ts.map