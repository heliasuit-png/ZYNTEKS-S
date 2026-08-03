import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .or(z.literal(""))
  .optional();

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(80, "Display name must be 80 characters or fewer."),
  avatarUrl: optionalUrl,
  language: z
    .string()
    .trim()
    .min(2, "Language is required.")
    .max(16),
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required.")
    .max(64),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be 72 characters or fewer."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changeEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "DELETE", {
      message: 'Type DELETE to confirm.',
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
