export const ENDPOINT_PATHS = {
    error: "/api/sdk/error",
    heartbeat: "/api/sdk/heartbeat",
    performance: "/api/sdk/performance",
    events: "/api/sdk/events",
};
/** Resolves the absolute (or same-origin relative) ingestion URL. */
export function resolveUrl(base, kind) {
    const path = ENDPOINT_PATHS[kind];
    if (!base) {
        return path;
    }
    return `${base.replace(/\/+$/, "")}${path}`;
}
//# sourceMappingURL=endpoints.js.map