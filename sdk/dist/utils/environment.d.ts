import type { BrowserInfo, DeviceInfo, MemoryInfo, NetworkInfo, OSInfo, ScreenInfo } from "../types";
export declare function isBrowser(): boolean;
export declare function getBrowser(): BrowserInfo;
export declare function getOS(): OSInfo;
export declare function getDevice(): DeviceInfo;
export declare function getScreen(): ScreenInfo;
export declare function getLanguage(): string;
export declare function getTimezone(): string;
export declare function getMemory(): MemoryInfo | undefined;
export declare function getNetwork(): NetworkInfo;
export declare function getCurrentUrl(): string;
//# sourceMappingURL=environment.d.ts.map