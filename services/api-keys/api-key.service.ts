import "server-only";

import { API_KEY_PREFIX } from "@/lib/constants";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import {
  createPage,
  normalizePagination,
} from "@/services/dashboard/pagination";
import {
  getPlanLimits,
  getSubscriptionPlan,
} from "@/services/account/plan.service";
import { getProjectById } from "@/services/projects/project.service";
import type { Project } from "@/services/projects/project.service";
import { generateApiKey, hashApiKey } from "@/services/api-keys/key-generator";
import type { TypedSupabaseClient } from "@/supabase/client";
import type {
  ApiKeyEnvironment,
  ApiKeyLogEvent,
  ApiKeyStatus,
  Database,
  Json,
} from "@/types/database";
import type { Paginated, PaginationParams } from "@/types/dashboard";

/**
 * API key service. Encapsulates all access to the `api_keys` and
 * `api_key_logs` tables. Only the SHA-256 hash of a key is stored; the
 * plaintext is returned once at creation/regeneration and never persisted.
 * Server-only.
 */

type Supabase = TypedSupabaseClient;

export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
type ApiKeyInsert = Database["public"]["Tables"]["api_keys"]["Insert"];
type ApiKeyLogInsert = Database["public"]["Tables"]["api_key_logs"]["Insert"];

interface LogEntry {
  apiKeyId?: string | null;
  projectId?: string | null;
  userId?: string | null;
  event: ApiKeyLogEvent;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Json;
}

/**
 * Appends an audit log entry. Failures here must never break the primary
 * operation, so the result is intentionally not inspected.
 */
async function logApiKeyEvent(client: Supabase, entry: LogEntry): Promise<void> {
  const payload: ApiKeyLogInsert = {
    api_key_id: entry.apiKeyId ?? null,
    project_id: entry.projectId ?? null,
    user_id: entry.userId ?? null,
    event: entry.event,
    ip_address: entry.ipAddress ?? null,
    user_agent: entry.userAgent ?? null,
    metadata: entry.metadata ?? {},
  };
  await client.from("api_key_logs").insert(payload);
}

export interface ListApiKeysParams extends Partial<PaginationParams> {
  projectId?: string;
  environment?: ApiKeyEnvironment;
  status?: ApiKeyStatus;
  search?: string;
}

export async function listApiKeys(
  supabase: Supabase,
  userId: string,
  params: ListApiKeysParams = {},
): Promise<Paginated<ApiKey>> {
  const pagination = normalizePagination(params);
  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;

  let query = supabase
    .from("api_keys")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (params.projectId) {
    query = query.eq("project_id", params.projectId);
  }
  if (params.environment) {
    query = query.eq("environment", params.environment);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }
  const search = params.search?.trim();
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw mapPostgrestError(error);
  }
  return createPage(data ?? [], count ?? 0, pagination);
}

export async function getApiKeyById(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<ApiKey> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw mapPostgrestError(error);
  }
  if (!data) {
    throw new NotFoundError("API key not found");
  }
  return data;
}

async function countActiveKeysForProject(
  supabase: Supabase,
  userId: string,
  projectId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("status", "active");

  if (error) {
    throw mapPostgrestError(error);
  }
  return count ?? 0;
}

export interface CreateApiKeyInput {
  projectId: string;
  name: string;
  environment: ApiKeyEnvironment;
}

export interface CreatedApiKey {
  apiKey: ApiKey;
  /** Full plaintext key. Displayed once to the user and never stored. */
  plainKey: string;
}

export async function createApiKey(
  supabase: Supabase,
  userId: string,
  input: CreateApiKeyInput,
): Promise<CreatedApiKey> {
  // Verifies ownership of the target project (throws NotFound otherwise).
  await getProjectById(supabase, userId, input.projectId);

  const plan = await getSubscriptionPlan(supabase, userId);
  const limits = getPlanLimits(plan);
  const activeCount = await countActiveKeysForProject(
    supabase,
    userId,
    input.projectId,
  );
  if (activeCount >= limits.apiKeysPerProject) {
    throw new ForbiddenError(
      `Your ${plan} plan allows up to ${limits.apiKeysPerProject} active keys per project.`,
    );
  }

  const generated = generateApiKey();
  const payload: ApiKeyInsert = {
    project_id: input.projectId,
    user_id: userId,
    name: input.name.trim(),
    key_hash: generated.hash,
    key_prefix: generated.prefix,
    environment: input.environment,
    status: "active",
  };

  const { data, error } = await supabase
    .from("api_keys")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw mapPostgrestError(error);
  }

  await logApiKeyEvent(supabase, {
    apiKeyId: data.id,
    projectId: data.project_id,
    userId,
    event: "created",
  });

  return { apiKey: data, plainKey: generated.key };
}

export async function revokeApiKey(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<ApiKey> {
  const { data, error } = await supabase
    .from("api_keys")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw mapPostgrestError(error);
  }
  if (!data) {
    throw new NotFoundError("API key not found");
  }

  await logApiKeyEvent(supabase, {
    apiKeyId: data.id,
    projectId: data.project_id,
    userId,
    event: "revoked",
  });

  return data;
}

export async function regenerateApiKey(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<CreatedApiKey> {
  const generated = generateApiKey();

  const { data, error } = await supabase
    .from("api_keys")
    .update({
      key_hash: generated.hash,
      key_prefix: generated.prefix,
      status: "active",
      revoked_at: null,
      last_used_at: null,
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw mapPostgrestError(error);
  }
  if (!data) {
    throw new NotFoundError("API key not found");
  }

  await logApiKeyEvent(supabase, {
    apiKeyId: data.id,
    projectId: data.project_id,
    userId,
    event: "regenerated",
  });

  return { apiKey: data, plainKey: generated.key };
}

export interface ApiKeyAuthContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ApiKeyAuthResult {
  apiKey: ApiKey;
  project: Project;
}

/**
 * Authenticates an incoming request by its plaintext API key.
 *
 * This is the seam the upcoming SDK will use: it hashes the presented key,
 * looks up the matching active key, records usage, and returns the associated
 * project. A privileged (service-role) client must be injected because SDK
 * requests are not authenticated as a Supabase user and therefore cannot rely
 * on Row Level Security. Returns `null` when authentication fails.
 */
export async function authenticateApiKey(
  admin: Supabase,
  plainKey: string,
  context: ApiKeyAuthContext = {},
): Promise<ApiKeyAuthResult | null> {
  if (!plainKey.startsWith(API_KEY_PREFIX)) {
    await logApiKeyEvent(admin, {
      event: "auth_failed",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: "malformed" },
    });
    return null;
  }

  const keyHash = hashApiKey(plainKey);

  const { data: apiKey, error } = await admin
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("status", "active")
    .maybeSingle();

  if (error || !apiKey) {
    await logApiKeyEvent(admin, {
      event: "auth_failed",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: "not_found" },
    });
    return null;
  }

  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("*")
    .eq("id", apiKey.project_id)
    .maybeSingle();

  if (projectError || !project) {
    await logApiKeyEvent(admin, {
      apiKeyId: apiKey.id,
      userId: apiKey.user_id,
      event: "auth_failed",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: "project_missing" },
    });
    return null;
  }

  await admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id);

  await logApiKeyEvent(admin, {
    apiKeyId: apiKey.id,
    projectId: apiKey.project_id,
    userId: apiKey.user_id,
    event: "auth_success",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { apiKey, project };
}
