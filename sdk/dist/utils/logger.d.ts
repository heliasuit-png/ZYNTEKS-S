export interface InternalLogger {
    debug: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
}
/**
 * Internal logger. Uses console.debug/console.warn only (never console.error)
 * so it cannot be captured by the SDK's own console.error collector.
 */
export declare function createLogger(debug: boolean): InternalLogger;
//# sourceMappingURL=logger.d.ts.map