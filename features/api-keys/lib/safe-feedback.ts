/**
 * User-facing feedback helpers for API key UI.
 * Never echo plaintext keys or stack traces.
 */

const KEY_PATTERN = /ZYN-KEY-[A-Za-z0-9]+/gi;

/** Strip accidental key material from a message. */
export function scrubApiKeySecrets(message: string): string {
  return message.replace(KEY_PATTERN, "ZYN-KEY-[REDACTED]");
}

/**
 * Map fetch/API failures to a short, safe toast message.
 * Does not log payloads.
 */
export function apiKeyActionErrorMessage(
  status: number | null,
  serverMessage?: string | null,
): string {
  if (serverMessage) {
    const scrubbed = scrubApiKeySecrets(serverMessage).trim();
    if (scrubbed && scrubbed.length <= 160 && !/\n/.test(scrubbed)) {
      return scrubbed;
    }
  }
  if (status === 401 || status === 403) {
    return "You are not allowed to change this API key.";
  }
  if (status === 404) {
    return "API key not found.";
  }
  if (status === 429) {
    return "Too many requests. Please try again shortly.";
  }
  if (status !== null && status >= 500) {
    return "Something went wrong on the server. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
