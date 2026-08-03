import { Context } from "./context";
import type { CollectorHost } from "../collectors/base";
import type { InternalLogger } from "../utils/logger";
import type { CaptureClient, EventLevel, PerformanceMetrics, RawError, ResolvedConfig, SdkEvent, ZynteksisConfig } from "../types";
/**
 * The ZYNTEKSIS client. Instantiate once and call {@link init} to begin
 * automatic capture.
 *
 * @example
 * const zyn = new Zynteksis({ apiKey: "ZYN-KEY-...", environment: "production", release: "1.0.0" });
 * zyn.init();
 */
export declare class Zynteksis implements CaptureClient, CollectorHost {
    readonly config: ResolvedConfig;
    readonly logger: InternalLogger;
    context: Context;
    private transport?;
    private collectors;
    private started;
    constructor(options: ZynteksisConfig);
    /** Starts telemetry capture. Safe to call multiple times and on the server. */
    init(): void;
    captureException(error: unknown, options?: {
        type?: string;
        level?: EventLevel;
    }): void;
    captureMessage(message: string, level?: EventLevel): void;
    captureEvent(event: SdkEvent): void;
    /** Stops all collectors, clears timers and detaches listeners. */
    close(): void;
    reportError(raw: RawError): void;
    reportEvent(event: SdkEvent): void;
    reportPerformance(metrics: PerformanceMetrics): void;
    reportHeartbeat(): void;
}
//# sourceMappingURL=client.d.ts.map