import {
  createPage,
  emptyPage,
  normalizePagination,
} from "@/services/dashboard/pagination";
import { getAuthenticatedUser } from "@/services/auth";
import { listAuditLogs } from "@/services/workspace/audit.service";
import { resolveActiveWorkspace } from "@/services/workspace";
import { createSupabaseServerClient } from "@/supabase/server";
import type { AuditAction } from "@/types/database";
import type {
  ActivityItem,
  ActivityType,
  Paginated,
  PaginationParams,
} from "@/types/dashboard";

/**
 * Lists recent account activity from the workspace audit log.
 */
export async function listActivity(
  params?: Partial<PaginationParams>,
): Promise<Paginated<ActivityItem>> {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return emptyPage<ActivityItem>(params);

    const { active } = await resolveActiveWorkspace(
      supabase,
      user.id,
      user.email,
    );

    const page = await listAuditLogs(supabase, {
      workspaceId: active.id,
      page: params?.page,
      pageSize: params?.pageSize,
    });

    const items = page.items.map((log) => ({
      id: log.id,
      type: mapAuditType(log.action),
      title: formatActionTitle(log.action),
      description: log.summary,
      createdAt: log.created_at,
    }));

    return createPage(items, page.total, normalizePagination(params));
  } catch {
    return emptyPage<ActivityItem>(params);
  }
}

export async function getRecentActivity(limit = 6): Promise<ActivityItem[]> {
  const page = await listActivity({ page: 1, pageSize: limit });
  return page.items;
}

function mapAuditType(action: AuditAction): ActivityType {
  if (action.startsWith("project_")) return "project";
  if (action.startsWith("api_key_")) return "api_key";
  if (action.includes("incident")) return "incident";
  if (action.startsWith("billing") || action === "billing_changed") {
    return "billing";
  }
  if (
    action.includes("invitation") ||
    action.includes("member") ||
    action.includes("role") ||
    action.includes("ownership")
  ) {
    return "member";
  }
  if (action === "ai_analysis") return "error";
  return "project";
}

function formatActionTitle(action: AuditAction): string {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
