/**
 * Pure async helpers.
 */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  factor?: number;
}

/**
 * Retries an async operation with exponential backoff. Throws the last error
 * once all attempts are exhausted.
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { retries = 3, delayMs = 250, factor = 2 } = options;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      await sleep(delayMs * factor ** attempt);
      attempt += 1;
    }
  }

  throw lastError;
}
