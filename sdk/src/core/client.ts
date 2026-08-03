import { resolveConfig } from "./config";
import { Context } from "./context";
import { getCurrentClient, setCurrentClient } from "./registry";
import { buildCollectors } from "../collectors";
import type { Collector, CollectorHost } from "../collectors/base";
import { Transport } from "../transport/transport";
import { errorToRaw } from "../utils/error";
import { isBrowser } from "../utils/environment";
import { createLogger } from "../utils/logger";
import type { InternalLogger } from "../utils/logger";
import { nowIso } from "../utils/time";
import { sanitizeErrorPayload, sanitizeEvent } from "../validators";
import type {
  CaptureClient,
  ErrorPayload,
  EventLevel,
  EventsPayload,
  HeartbeatPayload,
  PerformanceMetrics,
  PerformancePayload,
  RawError,
  ResolvedConfig,
  SdkEvent,
  ZynteksisConfig,
} from "../types";

/**
 * The ZYNTEKSIS client. Instantiate once and call {@link init} to begin
 * automatic capture.
 *
 * @example
 * const zyn = new Zynteksis({ apiKey: "ZYN-KEY-...", environment: "production", release: "1.0.0" });
 * zyn.init();
 */
export class Zynteksis implements CaptureClient, CollectorHost {
  readonly config: ResolvedConfig;
  readonly logger: InternalLogger;
  context!: Context;

  private transport?: Transport;
  private collectors: Collector[] = [];
  private started = false;

  constructor(options: ZynteksisConfig) {
    this.config = resolveConfig(options);
    this.logger = createLogger(this.config.debug);
  }

  /** Starts telemetry capture. Safe to call multiple times and on the server. */
  init(): void {
    if (this.started) {
      return;
    }
    if (!this.config.enabled) {
      this.logger.debug("SDK disabled; skipping init.");
      return;
    }
    if (!isBrowser()) {
      this.logger.debug("Non-browser environment; skipping init.");
      return;
    }

    this.started = true;
    this.context = new Context();
    this.transport = new Transport(this.config, this.logger);
    this.transport.start();
    setCurrentClient(this);

    this.collectors = buildCollectors(this);
    for (const collector of this.collectors) {
      try {
        collector.start();
      } catch (error) {
        this.logger.warn("collector failed to start", error);
      }
    }

    this.logger.debug("initialized", {
      environment: this.config.environment,
      release: this.config.release,
    });
  }

  captureException(
    error: unknown,
    options?: { type?: string; level?: EventLevel },
  ): void {
    const raw = errorToRaw(error);
    this.reportError({
      ...raw,
      type: options?.type ?? raw.type,
      level: options?.level ?? "error",
    });
  }

  captureMessage(message: string, level: EventLevel = "info"): void {
    this.reportEvent({ type: "message", level, message });
  }

  captureEvent(event: SdkEvent): void {
    this.reportEvent(event);
  }

  /** Stops all collectors, clears timers and detaches listeners. */
  close(): void {
    for (const collector of this.collectors) {
      try {
        collector.stop();
      } catch {
        // Ignore collector teardown failures.
      }
    }
    this.collectors = [];
    this.transport?.close();
    if (getCurrentClient() === this) {
      setCurrentClient(null);
    }
    this.started = false;
  }

  // --- CollectorHost implementation ---------------------------------------

  reportError(raw: RawError): void {
    if (!this.started || !this.transport) {
      return;
    }
    if (this.config.sampleRate < 1 && Math.random() > this.config.sampleRate) {
      return;
    }

    const payload = sanitizeErrorPayload({
      message: raw.message,
      stack: raw.stack ?? null,
      type: raw.type ?? null,
      level: raw.level ?? "error",
      url: this.context.currentUrl(),
      browser: this.context.browser,
      os: this.context.os,
      device: this.context.device,
      screen: this.context.screen,
      language: this.context.language,
      timezone: this.context.timezone,
      environment: this.config.environment,
      release: this.config.release,
      timestamp: nowIso(),
      performance: this.context.performance,
      network: this.context.getNetwork(),
      memory: this.context.getMemory(),
    });

    const finalPayload: ErrorPayload | null = this.config.beforeSend
      ? this.config.beforeSend(payload)
      : payload;
    if (!finalPayload) {
      return;
    }
    this.transport.send("error", finalPayload);
  }

  reportEvent(event: SdkEvent): void {
    if (!this.started || !this.transport) {
      return;
    }
    const sanitized = sanitizeEvent(event);
    const payload: EventsPayload = {
      environment: this.config.environment,
      release: this.config.release,
      events: [{ ...sanitized, timestamp: sanitized.timestamp ?? nowIso() }],
    };
    this.transport.send("events", payload);
  }

  reportPerformance(metrics: PerformanceMetrics): void {
    if (!this.started || !this.transport) {
      return;
    }
    const payload: PerformancePayload = {
      url: this.context.currentUrl(),
      ...metrics,
      environment: this.config.environment,
      release: this.config.release,
      timestamp: nowIso(),
    };
    this.transport.send("performance", payload);
  }

  reportHeartbeat(): void {
    if (!this.started || !this.transport) {
      return;
    }
    const payload: HeartbeatPayload = {
      timestamp: nowIso(),
      memory: this.context.getMemory(),
      uptime: this.context.uptimeSeconds(),
      page: this.context.currentUrl(),
      environment: this.config.environment,
      release: this.config.release,
    };
    this.transport.send("heartbeat", payload);
  }
}
