import { cn } from "@/lib/utils";
import type { AuthFormState } from "@/features/auth/types";

/** Renders the success or error message returned by an auth server action. */
export function FormMessage({ state }: { state: AuthFormState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  const isError = state.status === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        isError
          ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      )}
    >
      {state.message}
    </p>
  );
}
