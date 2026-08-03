import type { Database } from "@/types/database";

export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];

/** Serializable state returned by the API key server actions. */
export interface ApiKeyFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Present once after create/regenerate; the full key is never re-exposed. */
  plainKey?: string;
  apiKeyId?: string;
}

export const initialApiKeyFormState: ApiKeyFormState = { status: "idle" };
