export {
  signUpWithPassword,
  signInWithPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  changePassword,
  updateEmail,
  resendEmailVerification,
  exchangeCodeForSession,
  signInWithMagicLink,
  startOAuthSignIn,
  getAuthenticatedUser,
  listMfaFactors,
} from "@/services/auth/auth.service";
export type {
  SignUpParams,
  SignUpResult,
  SignInParams,
  PasswordResetParams,
  MagicLinkParams,
  OAuthSignInParams,
} from "@/services/auth/auth.service";
export {
  getOAuthProviderConfigs,
  getEnabledOAuthProviders,
  fetchSupabaseAuthSettings,
  identitiesToProviderKeys,
  mapSupabaseProviderToKey,
} from "@/services/auth/providers";
export type {
  AuthProviderKey,
  OAuthProviderConfig,
  OAuthProviderId,
} from "@/services/auth/provider-types";
export { recordLoginEvent } from "@/services/auth/login-events.service";
export { assertAuthRateLimit } from "@/services/auth/rate-limit";
export { getAuthRequestContext } from "@/services/auth/request-context";
export { getMfaStatus } from "@/services/auth/mfa.service";
