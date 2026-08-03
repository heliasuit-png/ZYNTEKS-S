import { getBrowser, getCurrentUrl, getDevice, getLanguage, getMemory, getNetwork, getOS, getScreen, getTimezone, } from "../utils/environment";
import { nowMs } from "../utils/time";
/**
 * Captures static device/browser context once and exposes dynamic getters for
 * values that change over time (memory, network, url, performance).
 */
export class Context {
    constructor() {
        this.performance = {};
        this.browser = getBrowser();
        this.os = getOS();
        this.device = getDevice();
        this.screen = getScreen();
        this.language = getLanguage();
        this.timezone = getTimezone();
        this.startedAt = nowMs();
    }
    getMemory() {
        return getMemory();
    }
    getNetwork() {
        return getNetwork();
    }
    currentUrl() {
        return getCurrentUrl();
    }
    uptimeSeconds() {
        return Math.round((nowMs() - this.startedAt) / 1000);
    }
    updatePerformance(patch) {
        this.performance = { ...this.performance, ...patch };
    }
}
//# sourceMappingURL=context.js.map