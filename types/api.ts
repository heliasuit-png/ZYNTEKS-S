import type { ErrorCode } from "@/lib/constants";

/**
 * Canonical shape of every JSON payload returned by the API layer. A response
 * is either a success carrying `data`, or a failure carrying `error`.
 */

export interface ApiErrorPayload {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export type ApiResponse<TData> =
  | ApiSuccessResponse<TData>
  | ApiErrorResponse;
