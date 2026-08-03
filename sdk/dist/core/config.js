const DEFAULT_HEARTBEAT_MS = 60000;
const DEFAULT_QUEUE_SIZE = 50;
const DEFAULT_MAX_PAYLOAD_BYTES = 256 * 1024;
function clamp01(value) {
    return Math.min(1, Math.max(0, value));
}
/** Validates user options and fills in defaults. Throws if apiKey is missing. */
export function resolveConfig(options) {
    if (!options ||
        typeof options.apiKey !== "string" ||
        options.apiKey.trim().length === 0) {
        throw new Error("[zynteksis] `apiKey` is required.");
    }
    return {
        apiKey: options.apiKey.trim(),
        environment: options.environment ?? "production",
        release: options.release,
        endpoint: (options.endpoint ?? "").trim(),
        debug: options.debug ?? false,
        enabled: options.enabled ?? true,
        sampleRate: typeof options.sampleRate === "number"
            ? clamp01(options.sampleRate)
            : 1,
        heartbeatInterval: options.heartbeatInterval ?? DEFAULT_HEARTBEAT_MS,
        maxQueueSize: options.maxQueueSize ?? DEFAULT_QUEUE_SIZE,
        maxPayloadBytes: options.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD_BYTES,
        compress: options.compress ?? true,
        captureConsole: options.captureConsole ?? true,
        captureNetwork: options.captureNetwork ?? true,
        captureResources: options.captureResources ?? true,
        capturePerformance: options.capturePerformance ?? true,
        captureHeartbeat: options.captureHeartbeat ?? true,
        axios: options.axios,
        beforeSend: options.beforeSend,
    };
}
//# sourceMappingURL=config.js.map