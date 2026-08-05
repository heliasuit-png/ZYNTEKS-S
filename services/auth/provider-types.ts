/** Shared OAuth provider types (safe for client components). */

export type OAuthProviderId = "google" | "github" | "azure" | "apple";

export type AuthProviderKey =
  | "google"
  | "github"
  | "microsoft"
  | "apple"
  | "email"
  | "magic_link";

export interface OAuthProviderConfig {
  key: Exclude<AuthProviderKey, "email" | "magic_link">;
  supabaseProvider: OAuthProviderId;
  label: string;
  configured: boolean;
}
