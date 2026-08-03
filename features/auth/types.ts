import type { User } from "@supabase/supabase-js";

import type { Profile } from "@/services/profile";

/**
 * Serializable state returned by every auth server action and consumed by the
 * client forms through `useActionState`.
 */
export interface AuthFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialAuthFormState: AuthFormState = { status: "idle" };

export interface AuthSession {
  user: User;
  profile: Profile;
}
