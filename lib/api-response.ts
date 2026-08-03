import { NextResponse } from "next/server";

import { HTTP_STATUS } from "@/lib/constants";
import type { HttpStatus } from "@/lib/constants";
import { toAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/types/api";

/**
 * API response helpers.
 *
 * Every route handler should return through these functions so that success
 * and error payloads share a single, predictable contract.
 */

export function ok<TData>(
  data: TData,
  status: HttpStatus = HTTP_STATUS.OK,
): NextResponse<ApiSuccessResponse<TData>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<TData>(
  data: TData,
): NextResponse<ApiSuccessResponse<TData>> {
  return ok(data, HTTP_STATUS.CREATED);
}

/**
 * Serializes any thrown value into a consistent error response. Non-operational
 * errors are logged and their internal message is hidden from the client.
 */
export function fail(error: unknown): NextResponse<ApiErrorResponse> {
  const appError = toAppError(error);

  if (!appError.isOperational) {
    logger.error("Unhandled API error", appError, {
      code: appError.code,
      statusCode: appError.statusCode,
    });
  }

  const message = appError.isOperational
    ? appError.message
    : "An unexpected error occurred";

  return NextResponse.json(
    {
      success: false,
      error: {
        code: appError.code,
        message,
        ...(appError.details !== undefined
          ? { details: appError.details }
          : {}),
      },
    },
    { status: appError.statusCode },
  );
}

/**
 * Wraps a route handler so any thrown error is converted into a structured
 * error response automatically.
 */
export function withErrorHandling<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response> | Response,
): (...args: TArgs) => Promise<Response> {
  return async (...args: TArgs): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return fail(error);
    }
  };
}
