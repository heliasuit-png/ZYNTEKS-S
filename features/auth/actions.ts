"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { z } from "zod";

import { ROUTES } from "@/lib/constants";
import { env } from "@/lib/env";
import { isAppError } from "@/lib/errors";
import { safeNextPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/supabase/server";
import {
  sendPasswordResetEmail,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
} from "@/services/auth";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/features/auth/schemas";
import type { AuthFormState } from "@/features/auth/types";

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors;
  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages && messages.length > 0) {
      result[key] = messages;
    }
  }
  return result;
}

function toErrorState(error: unknown): AuthFormState {
  if (isAppError(error)) {
    return { status: "error", message: error.message };
  }
  return {
    status: "error",
    message: "Something went wrong. Please try again.",
  };
}

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();

  try {
    await signInWithPassword(supabase, parsed.data);
  } catch (error) {
    return toErrorState(error);
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
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
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
    return toErrorState(error);
  }

  if (requiresEmailVerification) {
    return {
      status: "success",
      message:
        "Account created. Check your inbox to verify your email address.",
    };
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.dashboard);
}

export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();

  try {
    await sendPasswordResetEmail(supabase, {
      email: parsed.data.email,
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${ROUTES.resetPassword}`,
    });
  } catch (error) {
    return toErrorState(error);
  }

  return {
    status: "success",
    message:
      "If an account exists for that email, a password reset link is on its way.",
  };
}

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();

  try {
    await updatePassword(supabase, parsed.data.password);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/", "layout");
  redirect(`${ROUTES.login}?reset=success`);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await signOut(supabase);
  revalidatePath("/", "layout");
  redirect(ROUTES.login);
}
