export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiErrorPayload,
} from "@/types/api";
export type { Database, Json } from "@/types/database";

/** A value that may still be loading or absent. */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

/** Recursively marks all properties of `T` as optional. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
