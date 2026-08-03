/**
 * Public type definitions for the ZYNTEKSIS SDK.
 */
export type ZynteksisEnvironment = "production" | "staging" | "development";
export type EventLevel = "debug" | "info" | "warning" | "error" | "fatal";
export type PayloadKind = "error" | "heartbeat" | "performance" | "events";
/** Minimal structural type for an axios instance (avoids a hard dependency). */
export interface AxiosInterceptorManagerLike<V> {
    use(onFulfilled?: (value: V) => V | Promise<V>, onRejected?: (error: unknown) => unknown): number;
    eject?(id: number): void;
}
export interface AxiosLike {
    interceptors: {
        request: AxiosInterceptorManagerLike<unknown>;
        response: AxiosInterceptorManagerLike<unknown>;
    };
}
export interface BrowserInfo {
    name: string;
    version: string;
    userAgent: string;
}
export interface OSInfo {
    name: string;
    version: string;
}
export interface DeviceInfo {
    type: "desktop" | "mobile" | "tablet" | "unknown";
}
export interface ScreenInfo {
    width: number;
    height: number;
    pixelRatio: number;
}
export interface MemoryInfo {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
}
export interface NetworkInfo {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    online?: boolean;
}
export interface PerformanceMetrics {
    pageLoad?: number;
    fcp?: number;
    lcp?: number;
    cls?: number;
    inp?: number;
    ttfb?: number;
    navigation?: Record<string, number>;
}
export interface ErrorPayload {
    message: string;
    stack?: string | null;
    type?: string | null;
    level?: EventLevel;
    url?: string;
    browser?: BrowserInfo;
    os?: OSInfo;
    device?: DeviceInfo;
    screen?: ScreenInfo;
    language?: string;
    timezone?: string;
    environment?: ZynteksisEnvironment;
    release?: string;
    timestamp: string;
    performance?: PerformanceMetrics;
    network?: NetworkInfo;
    memory?: MemoryInfo;
}
export interface HeartbeatPayload {
    timestamp: string;
    memory?: MemoryInfo;
    uptime: number;
    page: string;
    environment?: ZynteksisEnvironment;
    release?: string;
}
export interface PerformancePayload extends PerformanceMetrics {
    url: string;
    environment?: ZynteksisEnvironment;
    release?: string;
    timestamp: string;
}
export interface SdkEvent {
    type: string;
    name?: string;
    level?: EventLevel;
    message?: string;
    url?: string;
    metadata?: Record<string, unknown>;
    timestamp?: string;
}
export interface EventsPayload {
    environment?: ZynteksisEnvironment;
    release?: string;
    events: Array<Required<Pick<SdkEvent, "timestamp">> & Omit<SdkEvent, "timestamp">>;
}
export type IngestPayload = ErrorPayload | HeartbeatPayload | PerformancePayload | EventsPayload;
/** A raw error captured by a collector before context enrichment. */
export interface RawError {
    message: string;
    stack?: string | null;
    type?: string | null;
    level?: EventLevel;
}
export interface ZynteksisConfig {
    /** ZYNTEKSIS API key in the form `ZYN-KEY-...`. Required. */
    apiKey: string;
    /** Deployment environment. Defaults to `production`. */
    environment?: ZynteksisEnvironment;
    /** Application release/version string. */
    release?: string;
    /**
     * Base URL of the ZYNTEKSIS ingestion host (e.g. `https://app.zynteksis.com`).
     * Leave empty to send to the current origin.
     */
    endpoint?: string;
    /** Emit verbose internal logs. Defaults to `false`. */
    debug?: boolean;
    /** Master switch. Defaults to `true`. */
    enabled?: boolean;
    /** Fraction of errors to capture (0..1). Defaults to `1`. */
    sampleRate?: number;
    /** Heartbeat interval in milliseconds. Defaults to `60000`. */
    heartbeatInterval?: number;
    /** Maximum number of persisted offline requests. Defaults to `50`. */
    maxQueueSize?: number;
    /** Maximum serialized payload size in bytes before dropping. */
    maxPayloadBytes?: number;
    /** Gzip large payloads when supported. Defaults to `true`. */
    compress?: boolean;
    captureConsole?: boolean;
    captureNetwork?: boolean;
    captureResources?: boolean;
    capturePerformance?: boolean;
    captureHeartbeat?: boolean;
    /** An axios instance to attach error interceptors to. */
    axios?: AxiosLike;
    /** Hook to mutate or drop (return null) an error before it is sent. */
    beforeSend?: (payload: ErrorPayload) => ErrorPayload | null;
}
export interface ResolvedConfig {
    apiKey: string;
    environment: ZynteksisEnvironment;
    release?: string;
    endpoint: string;
    debug: boolean;
    enabled: boolean;
    sampleRate: number;
    heartbeatInterval: number;
    maxQueueSize: number;
    maxPayloadBytes: number;
    compress: boolean;
    captureConsole: boolean;
    captureNetwork: boolean;
    captureResources: boolean;
    capturePerformance: boolean;
    captureHeartbeat: boolean;
    axios?: AxiosLike;
    beforeSend?: (payload: ErrorPayload) => ErrorPayload | null;
}
/** Subset of the client used by collectors and the React error boundary. */
export interface CaptureClient {
    captureException(error: unknown, options?: {
        type?: string;
        level?: EventLevel;
    }): void;
    captureMessage(message: string, level?: EventLevel): void;
    captureEvent(event: SdkEvent): void;
}
//# sourceMappingURL=index.d.ts.map