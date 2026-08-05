export {
  signInAction,
  signUpAction,
  magicLinkAction,
  startOAuthAction,
  forgotPasswordAction,
  resetPasswordAction,
  signOutAction,
} from "@/features/auth/actions";

export {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  magicLinkSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas";
export type {
  SignInInput,
  SignUpInput,
  ForgotPasswordInput,
  MagicLinkInput,
  ResetPasswordInput,
} from "@/features/auth/schemas";

export { initialAuthFormState } from "@/features/auth/types";
export type { AuthFormState, AuthSession } from "@/features/auth/types";

export { useAuth } from "@/features/auth/hooks/use-auth";
export type { UseAuthResult } from "@/features/auth/hooks/use-auth";

export { AuthCard } from "@/features/auth/components/auth-card";
export { LoginForm } from "@/features/auth/components/login-form";
export { RegisterForm } from "@/features/auth/components/register-form";
export { MagicLinkForm } from "@/features/auth/components/magic-link-form";
export { OAuthButtons } from "@/features/auth/components/oauth-buttons";
export { AuthMethodPanel } from "@/features/auth/components/auth-method-panel";
export { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
export { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
export { SignOutButton } from "@/features/auth/components/sign-out-button";
