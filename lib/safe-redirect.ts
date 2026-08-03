/**
 * Returns a same-origin relative path suitable for post-auth redirects.
 * Rejects protocol-relative URLs (`//evil.com`) and backslash tricks.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback: string,
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.includes("\\")) return fallback;
  if (next.includes("://")) return fallback;
  return next;
}
