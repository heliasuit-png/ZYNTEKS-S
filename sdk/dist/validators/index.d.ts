import type { ErrorPayload, SdkEvent } from "../types";
/**
 * Client-side validators/sanitizers.
 *
 * These bound and normalize payloads before transmission. The ingestion
 * server performs authoritative validation with Zod; these checks keep the
 * client lean and fail-safe without adding runtime dependencies.
 */
export declare const LIMITS: {
    readonly message: 2000;
    readonly stack: 20000;
    readonly url: 2000;
    readonly eventName: 200;
};
export declare function isNonEmptyString(value: unknown): value is string;
export declare function sanitizeErrorPayload(payload: ErrorPayload): ErrorPayload;
export declare function sanitizeEvent(event: SdkEvent): SdkEvent;
//# sourceMappingURL=index.d.ts.map