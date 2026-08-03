import type { AxiosLike } from "../types";
import type { Collector, CollectorHost } from "./base";

interface AxiosErrorShape {
  message?: string;
  stack?: string;
  config?: { url?: string; method?: string };
  response?: { status?: number };
}

/**
 * Attaches an error interceptor to an axios instance when one is available
 * (either via config or a global). No-op if axios is not present.
 */
export class AxiosErrorCollector implements Collector {
  private axiosRef?: AxiosLike;
  private interceptorId?: number;

  constructor(private readonly host: CollectorHost) {}

  start(): void {
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

  stop(): void {
    if (
      this.axiosRef &&
      this.interceptorId !== undefined &&
      typeof this.axiosRef.interceptors.response.eject === "function"
    ) {
      this.axiosRef.interceptors.response.eject(this.interceptorId);
    }
  }

  private detectGlobal(): AxiosLike | undefined {
    const candidate = (globalThis as { axios?: AxiosLike }).axios;
    return candidate && candidate.interceptors ? candidate : undefined;
  }

  private report(error: unknown): void {
    const shape = (error ?? {}) as AxiosErrorShape;
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
