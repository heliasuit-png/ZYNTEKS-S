/**
 * Attaches an error interceptor to an axios instance when one is available
 * (either via config or a global). No-op if axios is not present.
 */
export class AxiosErrorCollector {
    constructor(host) {
        this.host = host;
    }
    start() {
        const axios = this.host.config.axios ?? this.detectGlobal();
        if (!axios) {
            return;
        }
        this.axiosRef = axios;
        this.interceptorId = axios.interceptors.response.use(undefined, (error) => {
            this.report(error);
            return Promise.reject(error);
        });
    }
    stop() {
        if (this.axiosRef &&
            this.interceptorId !== undefined &&
            typeof this.axiosRef.interceptors.response.eject === "function") {
            this.axiosRef.interceptors.response.eject(this.interceptorId);
        }
    }
    detectGlobal() {
        const candidate = globalThis.axios;
        return candidate && candidate.interceptors ? candidate : undefined;
    }
    report(error) {
        const shape = (error ?? {});
        const status = shape.response?.status;
        const url = shape.config?.url;
        const suffix = `${status ? ` (${status})` : ""}${url ? ` ${url}` : ""}`;
        this.host.reportError({
            message: shape.message || `Axios request failed${suffix}`,
            stack: shape.stack ?? null,
            type: "axios",
            level: "error",
        });
    }
}
//# sourceMappingURL=axios.collector.js.map