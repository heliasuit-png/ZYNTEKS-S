import "server-only";

import { env } from "@/lib/env";
import type {
  AuthProviderKey,
  OAuthProviderConfig,
} from "@/services/auth/provider-types";

export type {
  AuthProviderKey,
  OAuthProviderConfig,
  OAuthProviderId,
} from "@/services/auth/provider-types";

function hasPair(id: string, secret: string): boolean {
  return Boolean(id.trim() && secret.trim());
}

/** Which OAuth buttons to expose — driven by env credentials (configured in Supabase too). */
export function getOAuthProviderConfigs(): OAuthProviderConfig[] {
  return [
    {
      key: "google",
      supabaseProvider: "google",
      label: "Continue with Google",
      configured: hasPair(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET),
    },
    {
      key: "github",
      supabaseProvider: "github",
      label: "Continue with GitHub",
      configured: hasPair(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET),
    },
    {
      key: "microsoft",
      supabaseProvider: "azure",
      label: "Continue with Microsoft",
      configured: hasPair(env.MICROSOFT_CLIENT_ID, env.MICROSOFT_CLIENT_SECRET),
    },
    {
      key: "apple",
      supabaseProvider: "apple",
      label: "Continue with Apple",
      configured: hasPair(env.APPLE_CLIENT_ID, env.APPLE_CLIENT_SECRET),
    },
  ];
}

export function getConfiguredOAuthProviders(): OAuthProviderConfig[] {
  return getOAuthProviderConfigs().filter((provider) => provider.configured);
}

export function mapSupabaseProviderToKey(
  provider: string | null | undefined,
): AuthProviderKey {
  switch (provider) {
    case "google":
      return "google";
    case "github":
      return "github";
    case "azure":
      return "microsoft";
    case "apple":
      return "apple";
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
