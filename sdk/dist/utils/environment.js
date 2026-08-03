export function isBrowser() {
    return typeof window !== "undefined" && typeof document !== "undefined";
}
function getUserAgent() {
    return typeof navigator !== "undefined" ? navigator.userAgent : "";
}
function matchVersion(ua, pattern) {
    const match = ua.match(pattern);
    return match && match[1] ? match[1] : "unknown";
}
export function getBrowser() {
    const ua = getUserAgent();
    let name = "unknown";
    let version = "unknown";
    if (/edg\//i.test(ua)) {
        name = "Edge";
        version = matchVersion(ua, /edg\/([\d.]+)/i);
    }
    else if (/opr\//i.test(ua) || /opera/i.test(ua)) {
        name = "Opera";
        version = matchVersion(ua, /(?:opr|opera)[/ ]([\d.]+)/i);
    }
    else if (/firefox\//i.test(ua)) {
        name = "Firefox";
        version = matchVersion(ua, /firefox\/([\d.]+)/i);
    }
    else if (/chrome\//i.test(ua)) {
        name = "Chrome";
        version = matchVersion(ua, /chrome\/([\d.]+)/i);
    }
    else if (/safari\//i.test(ua) && /version\//i.test(ua)) {
        name = "Safari";
        version = matchVersion(ua, /version\/([\d.]+)/i);
    }
    return { name, version, userAgent: ua };
}
export function getOS() {
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
export function getDevice() {
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
export function getScreen() {
    if (typeof window === "undefined" || typeof screen === "undefined") {
        return { width: 0, height: 0, pixelRatio: 1 };
    }
    return {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio || 1,
    };
}
export function getLanguage() {
    return typeof navigator !== "undefined" ? navigator.language : "unknown";
}
export function getTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    catch {
        return "unknown";
    }
}
export function getMemory() {
    if (typeof performance === "undefined") {
        return undefined;
    }
    const memory = performance.memory;
    if (!memory) {
        return undefined;
    }
    return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
}
export function getNetwork() {
    const online = typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
        ? navigator.onLine
        : undefined;
    const connection = typeof navigator !== "undefined"
        ? navigator.connection
        : undefined;
    return {
        online,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
    };
}
export function getCurrentUrl() {
    return typeof window !== "undefined" && window.location
        ? window.location.href
        : "";
}
//# sourceMappingURL=environment.js.map