"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ADMIN_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fieldErrorsFromZod } from "@/lib/i18n/localize-action";
import { signInWithPassword, signOut } from "@/services/auth";
import {
  getAdminUserByAuthId,
  touchAdminLastLogin,
} from "@/services/admin";
import { createSupabaseServerClient } from "@/supabase/server";
import { adminSignInSchema } from "@/features/admin/schemas";
import { safeAdminNextPath } from "@/features/admin/safe-admin-redirect";
import type { AdminFormState } from "@/features/admin/types";

function toErrorState(error: unknown, unexpected: string): AdminFormState {
  if (isAppError(error)) {
    return { status: "error", message: error.message };
  }
  return {
    status: "error",
    message: unexpected,
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
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = adminSignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error, am) };
  }

  const supabase = await createSupabaseServerClient();

  try {
    const session = await signInWithPassword(supabase, parsed.data);
    const admin = await getAdminUserByAuthId(supabase, session.user.id);

    if (!admin) {
      await signOut(supabase);
      return {
        status: "error",
        message: am.admin.notAuthorized,
      };
    }

    await touchAdminLastLogin(supabase, session.user.id);
  } catch (error) {
    return toErrorState(error, am.unexpectedError);
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
