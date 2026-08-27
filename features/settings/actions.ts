"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { DASHBOARD_ROUTES, ROUTES } from "@/lib/constants";
import { env } from "@/lib/env";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  fieldErrorsFromZod,
  firstZodMessage,
  toLocalizedErrorMessage,
} from "@/lib/i18n/localize-action";
import { rateLimit } from "@/lib/rate-limit";
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
import { mergePreferences } from "@/features/settings/lib/preferences";
import {
  initialSettingsActionState,
  type SettingsActionState,
} from "@/features/settings/types";
import type { Json } from "@/types/database";

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
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    avatarUrl: formData.get("avatarUrl") ?? "",
    language: formData.get("language") ?? "en",
    timezone: formData.get("timezone") ?? "UTC",
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsFromZod(parsed.error, am),
      message: firstZodMessage(parsed.error, am),
    };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: am.mustSignIn };

  try {
    await updateProfile(supabase, user.id, {
      full_name: parsed.data.fullName,
      avatar_url: parsed.data.avatarUrl || null,
      language: parsed.data.language,
      timezone: parsed.data.timezone,
    });
    revalidatePath(DASHBOARD_ROUTES.profile);
    revalidatePath(DASHBOARD_ROUTES.settings);
    return { status: "success", message: am.profileUpdated };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export async function uploadAvatarAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: am.avatarChooseImage };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { status: "error", message: am.avatarTooLarge };
  }
  if (!file.type.startsWith("image/")) {
    return { status: "error", message: am.avatarInvalidType };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: am.mustSignIn };

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
    return { status: "success", message: am.avatarUploaded };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export async function changePasswordAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsFromZod(parsed.error, am),
      message: firstZodMessage(parsed.error, am),
    };
  }

  const { supabase, user } = await resolveUser();
  if (!user?.email) {
    return { status: "error", message: am.mustSignIn };
  }

  const passwordLimit = rateLimit(`settings:password:${user.id}`, 5, 60_000);
  if (!passwordLimit.allowed) {
    return {
      status: "error",
      message: am.passwordChangeRateLimited,
    };
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
    return { status: "success", message: am.passwordUpdated };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export async function changeEmailAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = changeEmailSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { status: "error", message: firstZodMessage(parsed.error, am) };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: am.mustSignIn };

  try {
    await updateEmail(supabase, parsed.data.email);
    await updateProfile(supabase, user.id, { email: parsed.data.email });
    revalidatePath(DASHBOARD_ROUTES.profile);
    return {
      status: "success",
      message: am.emailConfirmSent,
    };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export async function resendVerificationAction(
  _prev: SettingsActionState = initialSettingsActionState,
  _formData?: FormData,
): Promise<SettingsActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const { supabase, user } = await resolveUser();
  if (!user?.email) {
    return { status: "error", message: am.mustSignIn };
  }
  try {
    await resendEmailVerification(
      supabase,
      user.email,
      `${env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    );
    return { status: "success", message: am.verificationEmailSent };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export async function deleteAccountAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = deleteAccountSchema.safeParse({
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    return { status: "error", message: firstZodMessage(parsed.error, am) };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: am.mustSignIn };

  const deleteLimit = rateLimit(`settings:delete:${user.id}`, 3, 3_600_000);
  if (!deleteLimit.allowed) {
    return {
      status: "error",
      message: am.accountDeleteRateLimited,
    };
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return { status: "error", message: error.message };
    }
    await signOut(supabase);
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
  redirect(ROUTES.login);
}

export async function updateAppearanceAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = appearancePreferencesSchema.safeParse({
    theme: formData.get("theme") ?? "dark",
    accent: formData.get("accent") ?? "blue",
    reducedMotion: checkbox(formData, "reducedMotion"),
    sidebarStyle: formData.get("sidebarStyle") ?? "expanded",
    density: formData.get("density") ?? "comfortable",
  });
  if (!parsed.success) {
    return { status: "error", message: firstZodMessage(parsed.error, am) };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: am.mustSignIn };

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
    return { status: "success", message: am.appearanceSaved };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export async function updateAiPreferencesAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = aiPreferencesSchema.safeParse({
    defaultModel: formData.get("defaultModel") ?? "gpt-4o-mini",
    streaming: checkbox(formData, "streaming"),
  });
  if (!parsed.success) {
    return { status: "error", message: firstZodMessage(parsed.error, am) };
  }

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: am.mustSignIn };

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
    return { status: "success", message: am.aiPreferencesSaved };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export async function deleteAllAiHistoryAction(
  _prev: SettingsActionState = initialSettingsActionState,
  _formData?: FormData,
): Promise<SettingsActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const { supabase, user } = await resolveUser();
  if (!user) return { status: "error", message: am.mustSignIn };

  try {
    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("user_id", user.id);
    if (error) throw error;
    revalidatePath(DASHBOARD_ROUTES.settingsAi);
    revalidatePath(DASHBOARD_ROUTES.aiAssistant);
    return { status: "success", message: am.conversationHistoryDeleted };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export { initialSettingsActionState };
