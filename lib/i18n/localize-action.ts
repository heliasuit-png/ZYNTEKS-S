import type { z } from "zod";

import type { ActionMessagesDictionary } from "@/lib/i18n/dictionaries/action-messages-types";
import { isAppError } from "@/lib/errors";

type ValidationKey = keyof ActionMessagesDictionary["validation"];

function localizeValidationMessage(
  raw: string,
  validation: ActionMessagesDictionary["validation"],
  fallback: string,
): string {
  if (raw in validation) {
    return validation[raw as ValidationKey];
  }
  return fallback;
}

/** Map Zod field errors whose messages are stable codes → localized strings. */
export function fieldErrorsFromZod(
  error: z.ZodError,
  am: ActionMessagesDictionary,
): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors;
  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (!messages || messages.length === 0) continue;
    result[key] = messages.map((m) =>
      localizeValidationMessage(m, am.validation, am.invalidInput),
    );
  }
  return result;
}

/** First Zod issue message, localized (or invalidInput). */
export function firstZodMessage(
  error: z.ZodError,
  am: ActionMessagesDictionary,
): string {
  const raw = error.issues[0]?.message;
  if (!raw) return am.invalidInput;
  return localizeValidationMessage(raw, am.validation, am.invalidInput);
}

/** User-facing catch message: AppError keeps service message; else unexpected. */
export function toLocalizedErrorMessage(
  error: unknown,
  am: ActionMessagesDictionary,
): string {
  if (isAppError(error)) return error.message;
  return am.unexpectedError;
}
