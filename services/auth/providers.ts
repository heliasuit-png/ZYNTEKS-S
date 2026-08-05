import "server-only";

import { env } from "@/lib/env";
import type {
  AuthProviderKey,
  OAuthProviderConfig,
  OAuthProviderId,
} from "@/services/auth/provider-types";

export type {
  AuthProviderKey,
  OAuthProviderConfig,
  OAuthProviderId,
} from "@/services/auth/provider-types";

const OAUTH_PROVIDERS: Omit<OAuthProviderConfig, "enabled">[] = [
  {
    key: "google",
    supabaseProvider: "google",
    label: "Continue with Google",
  },
  {
    key: "github",
    supabaseProvider: "github",
    label: "Continue with GitHub",
  },
];

interface SupabaseAuthSettings {
  external?: Record<string, boolean | undefined>;
}

/**
 * Public Supabase Auth settings — source of truth for which OAuth providers
 * are enabled in the dashboard (not app env vars).
 */
export async function fetchSupabaseAuthSettings(): Promise<SupabaseAuthSettings | null> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
      {
        headers: {
          apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        // Provider toggles change rarely; short cache avoids hammering Auth.
        next: { revalidate: 60 },
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as SupabaseAuthSettings;
  } catch {
    return null;
  }
}

function isProviderEnabled(
  settings: SupabaseAuthSettings | null,
  provider: OAuthProviderId,
): boolean {
  if (!settings?.external) {
    // Settings unavailable — allow the button; signInWithOAuth surfaces real errors.
    return true;
  }
  return settings.external[provider] === true;
}

/** Google / GitHub buttons — enabled state from Supabase Auth settings. */
export async function getOAuthProviderConfigs(): Promise<OAuthProviderConfig[]> {
  const settings = await fetchSupabaseAuthSettings();
  return OAUTH_PROVIDERS.map((provider) => ({
    ...provider,
    enabled: isProviderEnabled(settings, provider.supabaseProvider),
  }));
}

/** Providers currently enabled in Supabase Auth. */
export async function getEnabledOAuthProviders(): Promise<OAuthProviderConfig[]> {
  const all = await getOAuthProviderConfigs();
  return all.filter((provider) => provider.enabled);
}

export function mapSupabaseProviderToKey(
  provider: string | null | undefined,
): AuthProviderKey {
  switch (provider) {
    case "google":
      return "google";
    case "github":
      return "github";
    case "email":
      return "email";
    default:
      return "email";
  }
}

export function identitiesToProviderKeys(
  identities: { provider?: string | null }[] | null | undefined,
): AuthProviderKey[] {
  const keys = new Set<AuthProviderKey>();
  for (const identity of identities ?? []) {
    keys.add(mapSupabaseProviderToKey(identity.provider));
  }
  if (keys.size === 0) keys.add("email");
  return [...keys];
}
