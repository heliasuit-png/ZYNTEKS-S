import type { PostgrestError } from "@supabase/supabase-js";

import { ERROR_CODE, HTTP_STATUS } from "@/lib/constants";
import { AppError, ConflictError } from "@/lib/errors";

const UNIQUE_VIOLATION = "23505";

export interface MapPostgrestErrorOptions {
  /** When set, Postgres unique violations become ConflictError with this message. */
  uniqueConflictMessage?: string;
}

/**
 * Maps a PostgREST / Supabase query error into an operational {@link AppError}.
 */
export function mapPostgrestError(
  error: PostgrestError,
  options: MapPostgrestErrorOptions = {},
): AppError {
  if (options.uniqueConflictMessage && error.code === UNIQUE_VIOLATION) {
    return new ConflictError(options.uniqueConflictMessage, { cause: error });
  }

  return new AppError(error.message, {
    code: ERROR_CODE.BAD_REQUEST,
    statusCode: HTTP_STATUS.BAD_REQUEST,
    details: error.details,
    cause: error,
  });
}
