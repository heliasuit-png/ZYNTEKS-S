/** Shared OAuth provider types (safe for client components). */

export type OAuthProviderId = "google" | "github";

export type AuthProviderKey =
  | "google"
  | "github"
  | "email"
  | "magic_link";

export interface OAuthProviderConfig {
  key: Exclude<AuthProviderKey, "email" | "magic_link">;
  supabaseProvider: OAuthProviderId;
  label: string;
  /** True when Supabase Auth reports the provider as enabled. */
  enabled: boolean;
}
