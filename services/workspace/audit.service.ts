import "server-only";

import { ERROR_CODE, HTTP_STATUS } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import {
  createPage,
  normalizePagination,
} from "@/services/dashboard/pagination";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { AuditAction, Database, Json } from "@/types/database";
import type { Paginated, PaginationParams } from "@/types/dashboard";

type Supabase = TypedSupabaseClient;
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

export interface WriteAuditInput {
  workspaceId?: string | null;
  actorId: string;
  action: AuditAction;
  summary: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Json;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function writeAuditLog(
  supabase: Supabase,
  input: WriteAuditInput,
): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    workspace_id: input.workspaceId ?? null,
    actor_id: input.actorId,
    action: input.action,
    summary: input.summary,
    resource_type: input.resourceType ?? null,
    resource_id: input.resourceId ?? null,
    metadata: input.metadata ?? {},
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
  });

  if (error) {
    // Audit must never break the primary action.
    console.error("Failed to write audit log", error.message);
  }
}

export interface ListAuditParams extends Partial<PaginationParams> {
  workspaceId: string;
  search?: string;
  action?: AuditAction;
}

export async function listAuditLogs(
  supabase: Supabase,
  params: ListAuditParams,
): Promise<Paginated<AuditLog>> {
  const pagination = normalizePagination(params);
  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .eq("workspace_id", params.workspaceId);

  if (params.action) {
    query = query.eq("action", params.action);
  }
  const search = params.search?.trim();
  if (search) {
    query = query.ilike("summary", `%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError(error.message, {
      code: ERROR_CODE.BAD_REQUEST,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      cause: error,
    });
  }

  return createPage(data ?? [], count ?? 0, pagination);
}

export async function exportAuditLogsCsv(
  supabase: Supabase,
  workspaceId: string,
  limit = 1000,
): Promise<string> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("created_at, action, summary, resource_type, resource_id, actor_id, ip_address")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new AppError(error.message, {
      code: ERROR_CODE.BAD_REQUEST,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      cause: error,
    });
  }

  const header = [
    "created_at",
    "action",
    "summary",
    "resource_type",
    "resource_id",
    "actor_id",
    "ip_address",
  ];
  const rows = (data ?? []).map((row) =>
    [
      row.created_at,
      row.action,
      csvEscape(row.summary),
      row.resource_type ?? "",
      row.resource_id ?? "",
      row.actor_id ?? "",
      row.ip_address ?? "",
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
