import {
  getBrowser,
  getCurrentUrl,
  getDevice,
  getLanguage,
  getMemory,
  getNetwork,
  getOS,
  getScreen,
  getTimezone,
} from "../utils/environment";
import { nowMs } from "../utils/time";
import type {
  BrowserInfo,
  DeviceInfo,
  MemoryInfo,
  NetworkInfo,
  OSInfo,
  PerformanceMetrics,
  ScreenInfo,
} from "../types";

/**
 * Captures static device/browser context once and exposes dynamic getters for
 * values that change over time (memory, network, url, performance).
 */
export class Context {
  readonly browser: BrowserInfo;
  readonly os: OSInfo;
  readonly device: DeviceInfo;
  readonly screen: ScreenInfo;
  readonly language: string;
  readonly timezone: string;
  readonly startedAt: number;
  performance: PerformanceMetrics = {};

  constructor() {
    this.browser = getBrowser();
    this.os = getOS();
    this.device = getDevice();
    this.screen = getScreen();
    this.language = getLanguage();
    this.timezone = getTimezone();
    this.startedAt = nowMs();
  }

  getMemory(): MemoryInfo | undefined {
    return getMemory();
  }

  getNetwork(): NetworkInfo {
    return getNetwork();
  }

  currentUrl(): string {
    return getCurrentUrl();
  }

  uptimeSeconds(): number {
    return Math.round((nowMs() - this.startedAt) / 1000);
  }

  updatePerformance(patch: Partial<PerformanceMetrics>): void {
    this.performance = { ...this.performance, ...patch };
  }
}
