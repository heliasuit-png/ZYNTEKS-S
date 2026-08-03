"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DASHBOARD_ROUTES, ROUTES } from "@/lib/constants";
import { env } from "@/lib/env";
import { isAppError } from "@/lib/errors";
import {
  changePassword,
  getAuthenticatedUser,
  resendEmailVerification,
  signOut,
  updateEmail,
} from "@/services/auth";
import { updateProfile } from "@/services/profile";
import { createSupabaseServerClient } from "@/supabase/server";
import { createSupabaseAdminClient } from "@/supabase/admin";
import {
  appearancePreferencesSchema,
  aiPreferencesSchema,
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from "@/features/settings/schemas";
import { mergePreferences, parsePreferences } from "@/features/settings/lib/preferences";
import {
  initialSettingsActionState,
  type SettingsActionState,
} from "@/features/settings/types";
import type { Json } from "@/types/database";

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors;
  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages && messages.length > 0) result[key] = messages;
  }
  return result;
}

function toErrorMessage(error: unknown): string {
  if (isAppError(error)) return error.message;
  return "Something went wrong. Please try again.";
}

function checkbox(formData: FormData, name: string): boolean {
  const value = formData.get(name);
  return value === "on" || value === "true";
}

async function resolveUser() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  return { supabase, user };
}

export async function updateProfileAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    avatarUrl: formData.get("avatarUrl") ?? "",
    language: formData.get("language") ?? "en",
    timezone: formData.get("timezone") ?? "UTC",
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsFrom(parsed.error),
      message: parsed.error.issues[0]?.message,
    };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: "You must be signed in." };

  try {
    await updateProfile(supabase, user.id, {
      full_name: parsed.data.fullName,
      avatar_url: parsed.data.avatarUrl || null,
      language: parsed.data.language,
      timezone: parsed.data.timezone,
    });
    revalidatePath(DASHBOARD_ROUTES.profile);
    revalidatePath(DASHBOARD_ROUTES.settings);
    return { status: "success", message: "Profile updated." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function uploadAvatarAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose an image to upload." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { status: "error", message: "Avatar must be 2MB or smaller." };
  }
  if (!file.type.startsWith("image/")) {
    return { status: "error", message: "Upload a PNG, JPEG, WebP, or GIF image." };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: "You must be signed in." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, { contentType: file.type, upsert: true });
    if (uploadError) {
      return { status: "error", message: uploadError.message };
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await updateProfile(supabase, user.id, { avatar_url: data.publicUrl });
    revalidatePath(DASHBOARD_ROUTES.profile);
    return { status: "success", message: "Avatar uploaded." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function changePasswordAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsFrom(parsed.error),
      message: parsed.error.issues[0]?.message,
    };
  }

  const { supabase, user } = await resolveUser();
  if (!user?.email) {
    return { status: "error", message: "You must be signed in." };
  }

  try {
    await changePassword(
      supabase,
      user.email,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    await updateProfile(supabase, user.id, {
      password_changed_at: new Date().toISOString(),
    });
    revalidatePath(DASHBOARD_ROUTES.profile);
    revalidatePath(DASHBOARD_ROUTES.security);
    return { status: "success", message: "Password updated." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function changeEmailAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = changeEmailSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: "You must be signed in." };

  try {
    await updateEmail(supabase, parsed.data.email);
    await updateProfile(supabase, user.id, { email: parsed.data.email });
    revalidatePath(DASHBOARD_ROUTES.profile);
    return {
      status: "success",
      message: "Check your inbox to confirm the new email address.",
    };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function resendVerificationAction(
  _prev: SettingsActionState = initialSettingsActionState,
  _formData?: FormData,
): Promise<SettingsActionState> {
  const { supabase, user } = await resolveUser();
  if (!user?.email) {
    return { status: "error", message: "You must be signed in." };
  }
  try {
    await resendEmailVerification(
      supabase,
      user.email,
      `${env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    );
    return { status: "success", message: "Verification email sent." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function deleteAccountAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = deleteAccountSchema.safeParse({
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: "You must be signed in." };

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return { status: "error", message: error.message };
    }
    await signOut(supabase);
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
  redirect(ROUTES.login);
}

export async function updateAppearanceAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = appearancePreferencesSchema.safeParse({
    theme: formData.get("theme") ?? "dark",
    accent: formData.get("accent") ?? "blue",
    reducedMotion: checkbox(formData, "reducedMotion"),
    sidebarStyle: formData.get("sidebarStyle") ?? "expanded",
    density: formData.get("density") ?? "comfortable",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: "You must be signed in." };

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle();
    const next = mergePreferences(profile?.preferences as Json, {
      appearance: parsed.data,
    });
    await updateProfile(supabase, user.id, {
      preferences: next,
    });
    revalidatePath(DASHBOARD_ROUTES.settingsAppearance);
    return { status: "success", message: "Appearance preferences saved." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function updateAiPreferencesAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = aiPreferencesSchema.safeParse({
    defaultModel: formData.get("defaultModel") ?? "gpt-4o-mini",
    streaming: checkbox(formData, "streaming"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: "You must be signed in." };

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle();
    const next = mergePreferences(profile?.preferences as Json, {
      ai: parsed.data,
    });
    await updateProfile(supabase, user.id, { preferences: next });
    revalidatePath(DASHBOARD_ROUTES.settingsAi);
    return { status: "success", message: "AI preferences saved." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function deleteAllAiHistoryAction(
  _prev: SettingsActionState = initialSettingsActionState,
  _formData?: FormData,
): Promise<SettingsActionState> {
  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: "You must be signed in." };

  try {
    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("user_id", user.id);
    if (error) throw error;
    revalidatePath(DASHBOARD_ROUTES.settingsAi);
    revalidatePath(DASHBOARD_ROUTES.aiAssistant);
    return { status: "success", message: "Conversation history deleted." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export { initialSettingsActionState };
