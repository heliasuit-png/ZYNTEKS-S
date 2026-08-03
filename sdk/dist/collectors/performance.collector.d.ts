import type { Collector, CollectorHost } from "./base";
/**
 * Collects Web Vitals (FCP, LCP, CLS, INP, TTFB) and navigation timing using
 * PerformanceObserver. Metrics are surfaced to the shared context (so errors
 * carry them) and a single performance log is flushed when the page is hidden.
 */
export declare class PerformanceCollector implements Collector {
    private readonly host;
    private readonly observers;
    private metrics;
    private clsValue;
    private inpValue;
    private sent;
    private loadHandler?;
    private visibilityHandler?;
    private pageHideHandler?;
    constructor(host: CollectorHost);
    start(): void;
    stop(): void;
    private observe;
    private collectNavigation;
    private setMetric;
    private flush;
}
//# sourceMappingURL=performance.collector.d.ts.map