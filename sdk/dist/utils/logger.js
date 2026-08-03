const PREFIX = "[zynteksis]";
/**
 * Internal logger. Uses console.debug/console.warn only (never console.error)
 * so it cannot be captured by the SDK's own console.error collector.
 */
export function createLogger(debug) {
    return {
        debug: (...args) => {
            if (debug && typeof console !== "undefined") {
                console.debug(PREFIX, ...args);
            }
        },
        warn: (...args) => {
            if (debug && typeof console !== "undefined") {
                console.warn(PREFIX, ...args);
            }
        },
    };
}
//# sourceMappingURL=logger.js.map