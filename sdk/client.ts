import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import type { ErrorCode } from "@/lib/constants";
import type { ApiResponse } from "@/types/api";

/**
 * Typed HTTP client for talking to the ZYNTEKSIS API. It understands the
 * canonical {@link ApiResponse} envelope and throws a typed {@link AppError}
 * on failure so callers can rely on structured error handling.
 */

export interface HttpClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? env.NEXT_PUBLIC_APP_URL).replace(
      /\/$/,
      "",
    );
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...options.defaultHeaders,
    };
  }

  async request<TData>(
    path: string,
    options: RequestOptions = {},
  ): Promise<TData> {
    const { body, searchParams, headers, ...init } = options;

    const url = new URL(
      path.startsWith("http") ? path : `${this.baseUrl}${path}`,
    );

    if (searchParams) {
      for (const [key, value] of Object.entries(searchParams)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url, {
      ...init,
      headers: { ...this.defaultHeaders, ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const payload = (await response.json()) as ApiResponse<TData>;

    if (!response.ok || !payload.success) {
      const error = !payload.success
        ? payload.error
        : {
            code: "INTERNAL_SERVER_ERROR" as ErrorCode,
            message: response.statusText,
          };
      throw new AppError(error.message, {
        code: error.code,
        details: "details" in error ? error.details : undefined,
      });
    }

    return payload.data;
  }

  get<TData>(path: string, options?: RequestOptions): Promise<TData> {
    return this.request<TData>(path, { ...options, method: "GET" });
  }

  post<TData>(path: string, options?: RequestOptions): Promise<TData> {
    return this.request<TData>(path, { ...options, method: "POST" });
  }

  put<TData>(path: string, options?: RequestOptions): Promise<TData> {
    return this.request<TData>(path, { ...options, method: "PUT" });
  }

  patch<TData>(path: string, options?: RequestOptions): Promise<TData> {
    return this.request<TData>(path, { ...options, method: "PATCH" });
  }

  delete<TData>(path: string, options?: RequestOptions): Promise<TData> {
    return this.request<TData>(path, { ...options, method: "DELETE" });
  }
}
