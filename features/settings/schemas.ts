import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("invalid_url")
  .or(z.literal(""))
  .optional();

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "display_name_required")
    .max(80, "display_name_max"),
  avatarUrl: optionalUrl,
  language: z
    .string()
    .trim()
    .min(2, "language_required")
    .max(16),
  timezone: z
    .string()
    .trim()
    .min(1, "timezone_required")
    .max(64),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "current_password_required"),
    newPassword: z
      .string()
      .min(8, "password_min_8")
      .max(72, "password_max_72"),
    confirmPassword: z.string().min(1, "confirm_new_password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "passwords_mismatch",
    path: ["confirmPassword"],
  });

export const changeEmailSchema = z.object({
  email: z.string().trim().email("email_invalid"),
});

export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "DELETE", {
      message: "type_delete_confirm",
    }),
});

export const appearancePreferencesSchema = z.object({
  theme: z.enum(["dark", "light", "system"]),
  accent: z.string().trim().min(1),
  reducedMotion: z.boolean(),
  sidebarStyle: z.enum(["expanded", "collapsed", "icons"]),
  density: z.enum(["comfortable", "compact"]),
});

export const aiPreferencesSchema = z.object({
  defaultModel: z.string().trim().min(1).max(80),
  streaming: z.boolean(),
});
