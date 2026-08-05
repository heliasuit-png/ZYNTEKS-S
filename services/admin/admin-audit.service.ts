import "server-only";

import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { createSupabaseAdminClient } from "@/supabase/admin";
import type { AdminAuditAction, Json } from "@/types/database";

export interface WriteAdminAuditInput {
  actorId: string;
  action: AdminAuditAction;
  targetUserId?: string | null;
  targetWorkspaceId?: string | null;
  summary: string;
  metadata?: Json;
  ipAddress?: string | null;
}

export async function writeAdminAuditLog(
  input: WriteAdminAuditInput,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("admin_audit_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    target_user_id: input.targetUserId ?? null,
    target_workspace_id: input.targetWorkspaceId ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
    ip_address: input.ipAddress ?? null,
  });
  if (error) throw mapPostgrestError(error);
}

export async function listAdminAuditForTarget(
  targetUserId: string,
  limit = 30,
): Promise<
  {
    id: string;
    action: AdminAuditAction;
    summary: string;
    actorId: string | null;
    createdAt: string;
    metadata: Json;
  }[]
> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_audit_logs")
    .select("id, action, summary, actor_id, created_at, metadata")
    .eq("target_user_id", targetUserId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw mapPostgrestError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    summary: row.summary,
    actorId: row.actor_id,
    createdAt: row.created_at,
    metadata: row.metadata,
  }));
}

export async function listAdminAuditForWorkspace(
  workspaceId: string,
  limit = 40,
): Promise<
  {
    id: string;
    action: AdminAuditAction;
    summary: string;
    actorId: string | null;
    createdAt: string;
    metadata: Json;
  }[]
> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_audit_logs")
    .select("id, action, summary, actor_id, created_at, metadata")
    .eq("target_workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw mapPostgrestError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    summary: row.summary,
    actorId: row.actor_id,
    createdAt: row.created_at,
    metadata: row.metadata,
  }));
}
