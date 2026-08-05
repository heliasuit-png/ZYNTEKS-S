"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { z } from "zod";

import { ADMIN_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { signInWithPassword, signOut } from "@/services/auth";
import {
  getAdminUserByAuthId,
  touchAdminLastLogin,
} from "@/services/admin";
import { createSupabaseServerClient } from "@/supabase/server";
import { adminSignInSchema } from "@/features/admin/schemas";
import { safeAdminNextPath } from "@/features/admin/safe-admin-redirect";
import type { AdminFormState } from "@/features/admin/types";

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

function toErrorState(error: unknown): AdminFormState {
  if (isAppError(error)) {
    return { status: "error", message: error.message };
  }
  return {
    status: "error",
    message: "Something went wrong. Please try again.",
  };
}

/**
 * Admin Control Center sign-in.
 * Reuses product Supabase password auth, then requires `admin_users` membership.
 */
export async function adminSignInAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const parsed = adminSignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();

  try {
    const session = await signInWithPassword(supabase, parsed.data);
    const admin = await getAdminUserByAuthId(supabase, session.user.id);

    if (!admin) {
      await signOut(supabase);
      return {
        status: "error",
        message: "This account is not authorized for the Admin Control Center.",
      };
    }

    await touchAdminLastLogin(supabase, session.user.id);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(ADMIN_ROUTES.root, "layout");
  const next = safeAdminNextPath(String(formData.get("redirect") ?? ""));
  redirect(next);
}

export async function adminSignOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await signOut(supabase);
  revalidatePath(ADMIN_ROUTES.root, "layout");
  redirect(ADMIN_ROUTES.login);
}
