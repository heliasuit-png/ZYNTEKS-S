export interface InternalLogger {
  debug: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

const PREFIX = "[zynteksis]";

/**
 * Internal logger. Uses console.debug/console.warn only (never console.error)
 * so it cannot be captured by the SDK's own console.error collector.
 */
export function createLogger(debug: boolean): InternalLogger {
  return {
    debug: (...args: unknown[]) => {
      if (debug && typeof console !== "undefined") {
        console.debug(PREFIX, ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (debug && typeof console !== "undefined") {
        console.warn(PREFIX, ...args);
      }
    },
  };
}
