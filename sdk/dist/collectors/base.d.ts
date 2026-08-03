import type { Context } from "../core/context";
import type { InternalLogger } from "../utils/logger";
import type { PerformanceMetrics, RawError, ResolvedConfig, SdkEvent } from "../types";
/** A capability that observes the runtime and reports telemetry to the host. */
export interface Collector {
    start(): void;
    stop(): void;
}
/** The slice of the client that collectors depend on. */
export interface CollectorHost {
    readonly config: ResolvedConfig;
    readonly context: Context;
    readonly logger: InternalLogger;
    reportError(raw: RawError): void;
    reportEvent(event: SdkEvent): void;
    reportPerformance(metrics: PerformanceMetrics): void;
    reportHeartbeat(): void;
}
//# sourceMappingURL=base.d.ts.map