import type { BrowserInfo, DeviceInfo, MemoryInfo, NetworkInfo, OSInfo, PerformanceMetrics, ScreenInfo } from "../types";
/**
 * Captures static device/browser context once and exposes dynamic getters for
 * values that change over time (memory, network, url, performance).
 */
export declare class Context {
    readonly browser: BrowserInfo;
    readonly os: OSInfo;
    readonly device: DeviceInfo;
    readonly screen: ScreenInfo;
    readonly language: string;
    readonly timezone: string;
    readonly startedAt: number;
    performance: PerformanceMetrics;
    constructor();
    getMemory(): MemoryInfo | undefined;
    getNetwork(): NetworkInfo;
    currentUrl(): string;
    uptimeSeconds(): number;
    updatePerformance(patch: Partial<PerformanceMetrics>): void;
}
//# sourceMappingURL=context.d.ts.map