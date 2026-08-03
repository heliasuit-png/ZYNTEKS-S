/**
 * Lightweight structured logger.
 *
 * Emits JSON on the server (easy to ingest by Vercel / log drains) and a
 * readable format in the browser. The active level is controlled by the
 * `LOG_LEVEL` environment variable and defaults to `info`.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isServer = typeof window === "undefined";

function resolveLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL;
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

const activeLevel = resolveLevel();

function shouldLog(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[activeLevel];
}

function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { error };
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) {
    return;
  }

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const consoleMethod =
    level === "debug"
      ? console.debug
      : level === "info"
        ? console.info
        : level === "warn"
          ? console.warn
          : console.error;

  if (isServer) {
    consoleMethod(JSON.stringify(entry));
  } else {
    consoleMethod(`[${level.toUpperCase()}] ${message}`, context ?? "");
  }
}

export interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: unknown, context?: LogContext) => void;
  child: (bindings: LogContext) => Logger;
}

function createLogger(bindings: LogContext = {}): Logger {
  return {
    debug: (message, context) =>
      write("debug", message, { ...bindings, ...context }),
    info: (message, context) =>
      write("info", message, { ...bindings, ...context }),
    warn: (message, context) =>
      write("warn", message, { ...bindings, ...context }),
    error: (message, error, context) =>
      write("error", message, {
        ...bindings,
        ...context,
        ...(error !== undefined ? { error: serializeError(error) } : {}),
      }),
    child: (childBindings) => createLogger({ ...bindings, ...childBindings }),
  };
}

export const logger = createLogger();
