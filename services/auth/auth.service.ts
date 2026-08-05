import type { AuthError, Session, User } from "@supabase/supabase-js";

import { ERROR_CODE, HTTP_STATUS } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import type { TypedSupabaseClient } from "@/supabase/client";

/**
 * Authentication service layer.
 *
 * Framework-agnostic functions that encapsulate all Supabase Auth calls and
 * translate provider errors into the application's {@link AppError} contract.
 * Callers (server actions, route handlers) inject a Supabase client so the
 * same logic works across server, browser and admin contexts.
 */

type Supabase = TypedSupabaseClient;

function mapAuthError(error: AuthError): AppError {
  const status = error.status ?? HTTP_STATUS.BAD_REQUEST;
  const code =
    status === HTTP_STATUS.UNAUTHORIZED
      ? ERROR_CODE.UNAUTHORIZED
      : status === HTTP_STATUS.TOO_MANY_REQUESTS
        ? ERROR_CODE.RATE_LIMITED
        : ERROR_CODE.BAD_REQUEST;

  return new AppError(error.message, {
    code,
    statusCode: status as (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS],
    cause: error,
    details: {
      authCode: (error as { code?: string }).code ?? null,
      authStatus: error.status ?? null,
      authMessage: error.message,
    },
  });
}

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  emailRedirectTo: string;
}

export interface SignUpResult {
  user: User | null;
  /** True when Supabase requires the user to confirm their email address. */
  requiresEmailVerification: boolean;
}

export async function signUpWithPassword(
  supabase: Supabase,
  { email, password, fullName, emailRedirectTo }: SignUpParams,
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { full_name: fullName },
    },
  });

  if (error) {
    throw mapAuthError(error);
  }

  return {
    user: data.user,
    requiresEmailVerification: data.session === null,
  };
}

export interface SignInParams {
  email: string;
  password: string;
}

export async function signInWithPassword(
  supabase: Supabase,
  { email, password }: SignInParams,
): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw mapAuthError(error);
  }

  return data.session;
}

export async function signOut(supabase: Supabase): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw mapAuthError(error);
  }
}

export interface PasswordResetParams {
  email: string;
  redirectTo: string;
}

export async function sendPasswordResetEmail(
  supabase: Supabase,
  { email, redirectTo }: PasswordResetParams,
): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) {
    throw mapAuthError(error);
  }
}

export async function updatePassword(
  supabase: Supabase,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw mapAuthError(error);
  }
}

/** Re-authenticates with the current password, then sets a new password. */
export async function changePassword(
  supabase: Supabase,
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await signInWithPassword(supabase, {
    email,
    password: currentPassword,
  });
  await updatePassword(supabase, newPassword);
}

export async function updateEmail(
  supabase: Supabase,
  email: string,
): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email });
  if (error) {
    throw mapAuthError(error);
  }
}

export async function resendEmailVerification(
  supabase: Supabase,
  email: string,
  emailRedirectTo: string,
): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });
  if (error) {
    throw mapAuthError(error);
  }
}

export async function exchangeCodeForSession(
  supabase: Supabase,
  code: string,
): Promise<Session> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    throw mapAuthError(error);
  }
  return data.session;
}

export interface MagicLinkParams {
  email: string;
  emailRedirectTo: string;
  /** When true, creates a user if none exists (register via magic link). */
  shouldCreateUser?: boolean;
}

/** Passwordless email OTP / magic link via Supabase Auth PKCE. */
export async function signInWithMagicLink(
  supabase: Supabase,
  { email, emailRedirectTo, shouldCreateUser = true }: MagicLinkParams,
): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
      shouldCreateUser,
    },
  });
  if (error) throw mapAuthError(error);
}

export interface OAuthSignInParams {
  provider: "google" | "github";
  redirectTo: string;
  scopes?: string;
}

/**
 * Starts a Supabase Auth OAuth PKCE flow via `signInWithOAuth`.
 * Provider credentials must be configured in the Supabase Dashboard.
 */
export async function startOAuthSignIn(
  supabase: Supabase,
  { provider, redirectTo, scopes }: OAuthSignInParams,
): Promise<string> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      scopes,
      skipBrowserRedirect: true,
      queryParams:
        provider === "google"
          ? { prompt: "select_account", access_type: "online" }
          : undefined,
    },
  });
  if (error) throw mapAuthError(error);
  if (!data.url) {
    throw new AppError("OAuth provider did not return a redirect URL.", {
      code: ERROR_CODE.BAD_REQUEST,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  return data.url;
}

/** Returns the authenticated user, validated against the auth server. */
export async function getAuthenticatedUser(
  supabase: Supabase,
): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Lists MFA factors for architecture/UI readiness (Supabase Auth MFA). */
export async function listMfaFactors(supabase: Supabase) {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw mapAuthError(error);
  return data;
}
