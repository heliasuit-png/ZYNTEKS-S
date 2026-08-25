/**
 * Production safety for integration tests.
 * Never logs secrets. Throws if target is production.
 */

export const PRODUCTION_APP_HOSTS = new Set([
  "zynteksisv.vercel.app",
  "zynteks-s.vercel.app",
  "zynteksisv1.vercel.app",
]);

export const PRODUCTION_SUPABASE_HOSTS = new Set([
  "xwxfjzyfrcaxdwvkdedq.supabase.co",
]);

export function hostnameOf(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isProductionAppUrl(url: string | undefined | null): boolean {
  const host = hostnameOf(url);
  if (!host) return false;
  return PRODUCTION_APP_HOSTS.has(host);
}

export function isProductionSupabaseUrl(url: string | undefined | null): boolean {
  const host = hostnameOf(url);
  if (!host) return false;
  return PRODUCTION_SUPABASE_HOSTS.has(host);
}

export class ProductionGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductionGuardError";
  }
}

/**
 * Hard reject mutation-capable integration runs against production.
 */
export function assertNotProductionTarget(opts: {
  baseUrl?: string | null;
  supabaseUrl?: string | null;
}): void {
  if (isProductionAppUrl(opts.baseUrl ?? null)) {
    throw new ProductionGuardError(
      "BLOCKED: Integration tests cannot mutate Zynteksis production",
    );
  }
  if (isProductionSupabaseUrl(opts.supabaseUrl ?? null)) {
    throw new ProductionGuardError(
      "BLOCKED: Integration tests cannot mutate Zynteksis production Supabase",
    );
  }
}
