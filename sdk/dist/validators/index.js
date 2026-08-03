import { truncate } from "../utils/json";
/**
 * Client-side validators/sanitizers.
 *
 * These bound and normalize payloads before transmission. The ingestion
 * server performs authoritative validation with Zod; these checks keep the
 * client lean and fail-safe without adding runtime dependencies.
 */
export const LIMITS = {
    message: 2000,
    stack: 20000,
    url: 2000,
    eventName: 200,
};
export function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
export function sanitizeErrorPayload(payload) {
    return {
        ...payload,
        message: truncate(payload.message || "Unknown error", LIMITS.message),
        stack: typeof payload.stack === "string"
            ? truncate(payload.stack, LIMITS.stack)
            : (payload.stack ?? null),
        url: payload.url ? truncate(payload.url, LIMITS.url) : payload.url,
    };
}
export function sanitizeEvent(event) {
    return {
        ...event,
        type: truncate(event.type || "event", LIMITS.eventName),
        name: event.name ? truncate(event.name, LIMITS.eventName) : event.name,
        message: event.message
            ? truncate(event.message, LIMITS.message)
            : event.message,
        url: event.url ? truncate(event.url, LIMITS.url) : event.url,
    };
}
//# sourceMappingURL=index.js.map