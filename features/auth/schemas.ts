import { z } from "zod";

/**
 * Reusable Zod schemas for every authentication flow. Server actions and
 * client forms share these so validation stays consistent end-to-end.
 * Messages are stable codes mapped via actionMessages.validation.
 */

const email = z
  .string()
  .trim()
  .min(1, "email_required")
  .email("email_invalid");

const password = z
  .string()
  .min(8, "password_min_8")
  .max(72, "password_max_72")
  .regex(/[a-z]/, "password_lowercase")
  .regex(/[A-Z]/, "password_uppercase")
  .regex(/[0-9]/, "password_number");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "password_required"),
});

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "full_name_min")
      .max(120, "full_name_max"),
    email,
    password,
    confirmPassword: z.string().min(1, "password_confirm_required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwords_mismatch",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email,
});

export const magicLinkSchema = z.object({
  email,
});

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "password_confirm_required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwords_mismatch",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
