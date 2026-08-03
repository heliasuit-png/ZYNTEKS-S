import { ERROR_CODE, HTTP_STATUS } from "@/lib/constants";
import type { ErrorCode, HttpStatus } from "@/lib/constants";

/**
 * Error handling architecture.
 *
 * All expected/operational errors extend {@link AppError}, which carries an
 * HTTP status, a machine-readable code and optional structured details. This
 * lets the API layer translate errors into consistent responses without
 * leaking internals for unexpected failures.
 */

export interface AppErrorOptions {
  code?: ErrorCode;
  statusCode?: HttpStatus;
  details?: unknown;
  cause?: unknown;
  isOperational?: boolean;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: HttpStatus;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code ?? ERROR_CODE.INTERNAL;
    this.statusCode = options.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: unknown) {
    super(message, {
      code: ERROR_CODE.BAD_REQUEST,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      details,
    });
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, {
      code: ERROR_CODE.VALIDATION,
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      details,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, {
      code: ERROR_CODE.UNAUTHORIZED,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      details,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: unknown) {
    super(message, {
      code: ERROR_CODE.FORBIDDEN,
      statusCode: HTTP_STATUS.FORBIDDEN,
      details,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, {
      code: ERROR_CODE.NOT_FOUND,
      statusCode: HTTP_STATUS.NOT_FOUND,
      details,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: unknown) {
    super(message, {
      code: ERROR_CODE.CONFLICT,
      statusCode: HTTP_STATUS.CONFLICT,
      details,
    });
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "Payload too large", details?: unknown) {
    super(message, {
      code: ERROR_CODE.PAYLOAD_TOO_LARGE,
      statusCode: HTTP_STATUS.PAYLOAD_TOO_LARGE,
      details,
    });
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests", details?: unknown) {
    super(message, {
      code: ERROR_CODE.RATE_LIMITED,
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      details,
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", details?: unknown) {
    super(message, {
      code: ERROR_CODE.SERVICE_UNAVAILABLE,
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      details,
    });
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Normalizes any thrown value into an {@link AppError}. Unknown errors are
 * treated as non-operational internal server errors.
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, {
      cause: error,
      isOperational: false,
    });
  }

  return new AppError("An unexpected error occurred", {
    details: error,
    isOperational: false,
  });
}
