import { z } from "zod";

export const adminSignInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "email_required")
    .email("email_invalid"),
  password: z.string().min(1, "password_required"),
});

export type AdminSignInValues = z.infer<typeof adminSignInSchema>;
