import type {
  BrowserInfo,
  DeviceInfo,
  MemoryInfo,
  NetworkInfo,
  OSInfo,
  ScreenInfo,
} from "../types";

interface PerformanceWithMemory {
  memory?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}

interface NavigatorWithConnection {
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
}

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getUserAgent(): string {
  return typeof navigator !== "undefined" ? navigator.userAgent : "";
}

function matchVersion(ua: string, pattern: RegExp): string {
  const match = ua.match(pattern);
  return match && match[1] ? match[1] : "unknown";
}

export function getBrowser(): BrowserInfo {
  const ua = getUserAgent();
  let name = "unknown";
  let version = "unknown";

  if (/edg\//i.test(ua)) {
    name = "Edge";
    version = matchVersion(ua, /edg\/([\d.]+)/i);
  } else if (/opr\//i.test(ua) || /opera/i.test(ua)) {
    name = "Opera";
    version = matchVersion(ua, /(?:opr|opera)[/ ]([\d.]+)/i);
  } else if (/firefox\//i.test(ua)) {
    name = "Firefox";
    version = matchVersion(ua, /firefox\/([\d.]+)/i);
  } else if (/chrome\//i.test(ua)) {
    name = "Chrome";
    version = matchVersion(ua, /chrome\/([\d.]+)/i);
  } else if (/safari\//i.test(ua) && /version\//i.test(ua)) {
    name = "Safari";
    version = matchVersion(ua, /version\/([\d.]+)/i);
  }

  return { name, version, userAgent: ua };
}

export function getOS(): OSInfo {
  const ua = getUserAgent();

  if (/windows nt/i.test(ua)) {
    return { name: "Windows", version: matchVersion(ua, /windows nt ([\d.]+)/i) };
  }
  if (/android/i.test(ua)) {
    return { name: "Android", version: matchVersion(ua, /android ([\d.]+)/i) };
  }
  if (/iphone|ipad|ipod/i.test(ua)) {
    return {
      name: "iOS",
      version: matchVersion(ua, /os ([\d_]+)/i).replace(/_/g, "."),
    };
  }
  if (/mac os x/i.test(ua)) {
    return {
      name: "macOS",
      version: matchVersion(ua, /mac os x ([\d_]+)/i).replace(/_/g, "."),
    };
  }
  if (/linux/i.test(ua)) {
    return { name: "Linux", version: "unknown" };
  }
  return { name: "unknown", version: "unknown" };
}

export function getDevice(): DeviceInfo {
  const ua = getUserAgent();
  if (/ipad|tablet/i.test(ua)) {
    return { type: "tablet" };
  }
  if (/mobi|iphone|android.+mobile/i.test(ua)) {
    return { type: "mobile" };
  }
  if (ua) {
    return { type: "desktop" };
  }
  return { type: "unknown" };
}

export function getScreen(): ScreenInfo {
  if (typeof window === "undefined" || typeof screen === "undefined") {
    return { width: 0, height: 0, pixelRatio: 1 };
  }
  return {
    width: screen.width,
    height: screen.height,
    pixelRatio: window.devicePixelRatio || 1,
  };
}

export function getLanguage(): string {
  return typeof navigator !== "undefined" ? navigator.language : "unknown";
}

export function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "unknown";
  }
}

export function getMemory(): MemoryInfo | undefined {
  if (typeof performance === "undefined") {
    return undefined;
  }
  const memory = (performance as unknown as PerformanceWithMemory).memory;
  if (!memory) {
    return undefined;
  }
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };
}

export function getNetwork(): NetworkInfo {
  const online =
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : undefined;
  const connection =
    typeof navigator !== "undefined"
      ? (navigator as unknown as NavigatorWithConnection).connection
      : undefined;

  return {
    online,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
  };
}

export function getCurrentUrl(): string {
  return typeof window !== "undefined" && window.location
    ? window.location.href
    : "";
}
