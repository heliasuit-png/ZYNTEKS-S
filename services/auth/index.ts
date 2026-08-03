export {
  signUpWithPassword,
  signInWithPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  changePassword,
  updateEmail,
  resendEmailVerification,
  exchangeCodeForSession,
  getAuthenticatedUser,
} from "@/services/auth/auth.service";
export type {
  SignUpParams,
  SignUpResult,
  SignInParams,
  PasswordResetParams,
} from "@/services/auth/auth.service";
