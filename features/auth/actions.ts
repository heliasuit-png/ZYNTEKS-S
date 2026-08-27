"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ROUTES } from "@/lib/constants";
import { env } from "@/lib/env";
import { isAppError } from "@/lib/errors";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fieldErrorsFromZod } from "@/lib/i18n/localize-action";
import { safeNextPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/supabase/server";
import {
  assertAuthRateLimit,
  recordLoginEvent,
  sendPasswordResetEmail,
  signInWithMagicLink,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  startOAuthSignIn,
  updatePassword,
} from "@/services/auth";
import { getAuthRequestContext } from "@/services/auth/request-context";
import { touchSession } from "@/services/workspace";
import {
  forgotPasswordSchema,
  magicLinkSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/features/auth/schemas";
import type { AuthFormState } from "@/features/auth/types";

function toErrorState(
  error: unknown,
  unexpected: string,
): AuthFormState {
  if (isAppError(error)) {
    return {
      status: "error",
      message: error.message,
    };
  }
  return {
    status: "error",
    message: unexpected,
  };
}

function rateKey(prefix: string, email?: string, ip?: string | null): string {
  return `${prefix}:${(email ?? "anon").toLowerCase()}:${ip ?? "unknown"}`;
}

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error, am) };
  }

  const ctx = await getAuthRequestContext();
  try {
    assertAuthRateLimit(rateKey("password", parsed.data.email, ctx.ipAddress));
  } catch (error) {
    return toErrorState(error, am.unexpectedError);
  }

  const supabase = await createSupabaseServerClient();

  try {
    const session = await signInWithPassword(supabase, parsed.data);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await recordLoginEvent({
      userId: user?.id,
      email: parsed.data.email,
      method: "password",
      provider: "email",
      ipAddress: ctx.ipAddress,
      country: ctx.country,
      userAgent: ctx.userAgent,
    });

    if (user) {
      try {
        await touchSession(supabase, {
          userId: user.id,
          accessToken: session.access_token,
          userAgent: ctx.userAgent,
          ipAddress: ctx.ipAddress,
          country: ctx.country,
        });
      } catch {
        // best-effort
      }
    }
  } catch (error) {
    await recordLoginEvent({
      email: parsed.data.email,
      method: "password",
      provider: "email",
      result: "failure",
      ipAddress: ctx.ipAddress,
      country: ctx.country,
      userAgent: ctx.userAgent,
    });
    return toErrorState(error, am.unexpectedError);
  }

  revalidatePath("/", "layout");
  const next = safeNextPath(
    String(formData.get("redirect") ?? ""),
    ROUTES.dashboard,
  );
  redirect(next);
}

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const { getPlatformRuntimeSettings } = await import(
    "@/services/platform/runtime-settings.service"
  );
  const platform = await getPlatformRuntimeSettings();
  if (!platform.registrationEnabled) {
    return {
      status: "error",
      message: am.auth.registrationDisabled,
    };
  }

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error, am) };
  }

  if (parsed.data.password.length < platform.passwordMinLength) {
    return {
      status: "error",
      fieldErrors: {
        password: [
          fillTemplate(am.auth.passwordMinLength, {
            min: platform.passwordMinLength,
          }),
        ],
      },
    };
  }

  const ctx = await getAuthRequestContext();
  try {
    assertAuthRateLimit(rateKey("signup", parsed.data.email, ctx.ipAddress), 8);
  } catch (error) {
    return toErrorState(error, am.unexpectedError);
  }

  const supabase = await createSupabaseServerClient();

  let requiresEmailVerification = true;
  try {
    const result = await signUpWithPassword(supabase, {
      email: parsed.data.email,
      password: parsed.data.password,
      fullName: parsed.data.fullName,
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${ROUTES.dashboard}`,
    });
    requiresEmailVerification = result.requiresEmailVerification;
  } catch (error) {
    return toErrorState(error, am.unexpectedError);
  }

  if (requiresEmailVerification) {
    return {
      status: "success",
      message: am.auth.accountCreatedVerify,
    };
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.dashboard);
}

export async function magicLinkAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error, am) };
  }

  const ctx = await getAuthRequestContext();
  try {
    assertAuthRateLimit(rateKey("magic", parsed.data.email, ctx.ipAddress), 6);
  } catch (error) {
    return toErrorState(error, am.unexpectedError);
  }

  const redirectPath = safeNextPath(
    String(formData.get("redirect") ?? ""),
    ROUTES.dashboard,
  );
  const supabase = await createSupabaseServerClient();

  try {
    await signInWithMagicLink(supabase, {
      email: parsed.data.email,
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      shouldCreateUser: true,
    });
  } catch (error) {
    return toErrorState(error, am.unexpectedError);
  }

  return {
    status: "success",
    message: am.auth.magicLinkSent,
  };
}

export async function startOAuthAction(
  providerKey: string,
  redirectTo?: string,
): Promise<AuthFormState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  if (providerKey !== "google" && providerKey !== "github") {
    return { status: "error", message: am.auth.unknownProvider };
  }

  const ctx = await getAuthRequestContext();
  try {
    assertAuthRateLimit(rateKey(`oauth:${providerKey}`, undefined, ctx.ipAddress), 20);
  } catch (error) {
    return toErrorState(error, am.unexpectedError);
  }

  const next = safeNextPath(redirectTo ?? "", ROUTES.dashboard);
  const callback = `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`;
  const supabase = await createSupabaseServerClient();

  try {
    const url = await startOAuthSignIn(supabase, {
      provider: providerKey,
      redirectTo: callback,
      scopes: providerKey === "github" ? "read:user user:email" : undefined,
    });
    redirect(url);
  } catch (error) {
    // Next.js redirect() throws; rethrow those.
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return toErrorState(error, am.unexpectedError);
  }
}

export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error, am) };
  }

  const ctx = await getAuthRequestContext();
  try {
    assertAuthRateLimit(rateKey("reset", parsed.data.email, ctx.ipAddress), 6);
  } catch (error) {
    return toErrorState(error, am.unexpectedError);
  }

  const supabase = await createSupabaseServerClient();

  try {
    await sendPasswordResetEmail(supabase, {
      email: parsed.data.email,
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${ROUTES.resetPassword}`,
    });
  } catch (error) {
    return toErrorState(error, am.unexpectedError);
  }

  return {
    status: "success",
    message: am.auth.resetLinkSent,
  };
}

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error, am) };
  }

  const supabase = await createSupabaseServerClient();

  try {
    await updatePassword(supabase, parsed.data.password);
    const ctx = await getAuthRequestContext();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await recordLoginEvent({
      method: "recovery",
      provider: "email",
      userId: user?.id,
      email: user?.email,
      ipAddress: ctx.ipAddress,
      country: ctx.country,
      userAgent: ctx.userAgent,
    });
  } catch (error) {
    return toErrorState(error, am.unexpectedError);
  }

  revalidatePath("/", "layout");
  redirect(`${ROUTES.login}?reset=success`);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await signOut(supabase);
  revalidatePath("/", "layout");
  redirect(`${ROUTES.login}?signedOut=1`);
}
