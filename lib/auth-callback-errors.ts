import { isAppError } from "@/lib/errors";

/** Safe query codes only — never put raw provider/DB messages in the URL. */
export const AUTH_CALLBACK_ERROR = {
  missing_code: "missing_code",
  auth_failed: "auth_failed",
  suspended: "suspended",
} as const;

export type AuthCallbackErrorCode =
  (typeof AUTH_CALLBACK_ERROR)[keyof typeof AUTH_CALLBACK_ERROR];

/**
 * Maps thrown errors to a generic login query code. Never returns tokens,
 * provider secrets, stack traces, or raw database messages to the client.
 */
export function sanitizeAuthCallbackError(error: unknown): {
  code: AuthCallbackErrorCode;
  logMessage: string;
} {
  if (isAppError(error) && /suspend/i.test(error.message)) {
    return {
      code: AUTH_CALLBACK_ERROR.suspended,
      logMessage: "account_suspended",
    };
  }
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "auth_failed";
  const logMessage = raw
    .replace(
      /(access_token|refresh_token|api[_-]?key|secret|password|bearer)\s*[:=]\s*\S+/gi,
      "$1=[redacted]",
    )
    .slice(0, 200);
  return { code: AUTH_CALLBACK_ERROR.auth_failed, logMessage };
}
