/**
 * Collects Web Vitals (FCP, LCP, CLS, INP, TTFB) and navigation timing using
 * PerformanceObserver. Metrics are surfaced to the shared context (so errors
 * carry them) and a single performance log is flushed when the page is hidden.
 */
export class PerformanceCollector {
    constructor(host) {
        this.host = host;
        this.observers = [];
        this.metrics = {};
        this.clsValue = 0;
        this.inpValue = 0;
        this.sent = false;
    }
    start() {
        if (typeof window === "undefined") {
            return;
        }
        this.collectNavigation();
        this.observe("paint", (entries) => {
            for (const entry of entries) {
                if (entry.name === "first-contentful-paint") {
                    this.setMetric({ fcp: entry.startTime });
                }
            }
        });
        this.observe("largest-contentful-paint", (entries) => {
            const last = entries[entries.length - 1];
            if (last) {
                this.setMetric({ lcp: last.startTime });
            }
        });
        this.observe("layout-shift", (entries) => {
            for (const entry of entries) {
                const shift = entry;
                if (!shift.hadRecentInput && typeof shift.value === "number") {
                    this.clsValue += shift.value;
                }
            }
            this.setMetric({ cls: this.clsValue });
        });
        this.observe("event", (entries) => {
            for (const entry of entries) {
                if (entry.duration > this.inpValue) {
                    this.inpValue = entry.duration;
                }
            }
            this.setMetric({ inp: this.inpValue });
        });
        this.loadHandler = () => {
            this.collectNavigation();
            this.host.context.updatePerformance(this.metrics);
        };
        window.addEventListener("load", this.loadHandler);
        this.visibilityHandler = () => {
            if (typeof document !== "undefined" && document.visibilityState === "hidden") {
                this.flush();
            }
        };
        document.addEventListener("visibilitychange", this.visibilityHandler);
        this.pageHideHandler = () => this.flush();
        window.addEventListener("pagehide", this.pageHideHandler);
    }
    stop() {
        for (const observer of this.observers) {
            observer.disconnect();
        }
        this.observers.length = 0;
        if (this.loadHandler) {
            window.removeEventListener("load", this.loadHandler);
        }
        if (this.visibilityHandler && typeof document !== "undefined") {
            document.removeEventListener("visibilitychange", this.visibilityHandler);
        }
        if (this.pageHideHandler) {
            window.removeEventListener("pagehide", this.pageHideHandler);
        }
    }
    observe(type, callback) {
        if (typeof PerformanceObserver === "undefined") {
            return;
        }
        try {
            const observer = new PerformanceObserver((list) => {
                callback(list.getEntries());
            });
            observer.observe({ type, buffered: true });
            this.observers.push(observer);
        }
        catch {
            // Entry type unsupported in this browser.
        }
    }
    collectNavigation() {
        if (typeof performance === "undefined") {
            return;
        }
        try {
            const entry = performance.getEntriesByType("navigation")[0];
            if (!entry) {
                return;
            }
            const navigation = {
                dns: entry.domainLookupEnd - entry.domainLookupStart,
                tcp: entry.connectEnd - entry.connectStart,
                request: entry.responseStart - entry.requestStart,
                response: entry.responseEnd - entry.responseStart,
                domInteractive: entry.domInteractive,
                domContentLoaded: entry.domContentLoadedEventEnd,
                load: entry.loadEventEnd,
            };
            this.setMetric({
                ttfb: entry.responseStart,
                pageLoad: entry.loadEventEnd > 0
                    ? entry.loadEventEnd - entry.startTime
                    : this.metrics.pageLoad,
                navigation,
            });
        }
        catch {
            // Navigation timing unavailable.
        }
    }
    setMetric(patch) {
        this.metrics = { ...this.metrics, ...patch };
        this.host.context.updatePerformance(this.metrics);
    }
    flush() {
        if (this.sent) {
            return;
        }
        this.sent = true;
        this.host.reportPerformance(this.metrics);
    }
}
//# sourceMappingURL=performance.collector.js.map