import { BadRequestError, NotFoundError } from "@/lib/errors";
import {
  createPage,
  normalizePagination,
} from "@/services/dashboard/pagination";
import { assertValidTransition } from "@/services/incidents/transitions";
import { createSupabaseAdminClient } from "@/supabase/admin";
import type { TypedSupabaseClient } from "@/supabase/client";
import type {
  Database,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/database";
import type { Paginated, PaginationParams } from "@/types/dashboard";
import type { Incident, IncidentWithUpdates } from "./types";

/**
 * User-scoped incident service. Reads and mutates incidents owned by the
 * current user; Row Level Security enforces ownership via the injected client.
 */

type Supabase = TypedSupabaseClient;

export interface ListIncidentsParams extends Partial<PaginationParams> {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  projectId?: string;
  openOnly?: boolean;
  search?: string;
  /** ISO lower bound on started_at */
  from?: string;
  /** ISO upper bound on started_at */
  to?: string;
  sort?: "started_at" | "severity" | "status" | "resolved_at";
  sortDir?: "asc" | "desc";
}

function sanitizeSearch(value: string): string {
  return value.replace(/[%_,.()]/g, " ").trim();
}

export async function listIncidents(
  supabase: Supabase,
  userId: string,
  params: ListIncidentsParams = {},
): Promise<Paginated<Incident>> {
  const pagination = normalizePagination(params);
  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;

  let query = supabase
    .from("incidents")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.severity) {
    query = query.eq("severity", params.severity);
  }
  if (params.projectId) {
    query = query.eq("project_id", params.projectId);
  }
  if (params.openOnly) {
    query = query.neq("status", "resolved");
  }
  if (params.from) {
    query = query.gte("started_at", params.from);
  }
  if (params.to) {
    query = query.lte("started_at", params.to);
  }

  const search = sanitizeSearch(params.search ?? "");
  if (search) {
    // UUID exact match or title/description ILIKE
    const uuidLike =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        search,
      );
    if (uuidLike) {
      query = query.or(`id.eq.${search},title.ilike.%${search}%`);
    } else {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }
  }

  const sortColumn = params.sort ?? "started_at";
  const ascending = (params.sortDir ?? "desc") === "asc";

  const { data, error, count } = await query
    .order(sortColumn, { ascending, nullsFirst: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  return createPage(data ?? [], count ?? 0, pagination);
}

export async function countOpenIncidents(
  supabase: Supabase,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "resolved");
  if (error) {
    throw error;
  }
  return count ?? 0;
}

export async function getIncidentById(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<IncidentWithUpdates> {
  const { data: incident, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!incident) {
    throw new NotFoundError("Incident not found");
  }

  const { data: updates, error: updatesError } = await supabase
    .from("incident_updates")
    .select("*")
    .eq("incident_id", id)
    .order("created_at", { ascending: false });

  if (updatesError) {
    throw updatesError;
  }

  return { incident, updates: updates ?? [] };
}

export interface AddIncidentUpdateInput {
  message: string;
  status?: IncidentStatus;
}

/**
 * Posts a timeline update and optionally transitions the incident status.
 * Transitioning to `resolved` records `resolved_at`, downtime, and notifies.
 */
export async function addIncidentUpdate(
  supabase: Supabase,
  userId: string,
  incidentId: string,
  input: AddIncidentUpdateInput,
): Promise<Incident> {
  const { data: incident, error: fetchError } = await supabase
    .from("incidents")
    .select("*")
    .eq("user_id", userId)
    .eq("id", incidentId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }
  if (!incident) {
    throw new NotFoundError("Incident not found");
  }

  if (input.status && input.status !== incident.status) {
    try {
      assertValidTransition(incident.status, input.status);
    } catch (error) {
      throw new BadRequestError(
        error instanceof Error ? error.message : "Invalid status transition.",
      );
    }
  }

  if (incident.status === "resolved" && input.status && input.status !== "resolved") {
    throw new BadRequestError("Resolved incidents cannot be reopened.");
  }

  const { error: insertError } = await supabase.from("incident_updates").insert({
    incident_id: incidentId,
    user_id: userId,
    status: input.status ?? null,
    message: input.message,
  });
  if (insertError) {
    throw insertError;
  }

  if (!input.status || input.status === incident.status) {
    return incident;
  }

  const patch: Database["public"]["Tables"]["incidents"]["Update"] = {
    status: input.status,
  };
  let downtimeSeconds: number | null = incident.downtime_seconds;
  let resolvedAtIso: string | null = incident.resolved_at;

  if (input.status === "resolved" && !incident.resolved_at) {
    const resolvedAt = new Date();
    resolvedAtIso = resolvedAt.toISOString();
    downtimeSeconds = Math.max(
      0,
      Math.floor(
        (resolvedAt.getTime() - new Date(incident.started_at).getTime()) / 1000,
      ),
    );
    patch.resolved_at = resolvedAtIso;
    patch.downtime_seconds = downtimeSeconds;
    patch.auto_resolved = false;
  }

  const { data: updated, error: updateError } = await supabase
    .from("incidents")
    .update(patch)
    .eq("user_id", userId)
    .eq("id", incidentId)
    .select("*")
    .single();

  if (updateError) {
    throw updateError;
  }

  // Notify on manual resolve (dashboard + email via notification engine).
  if (
    input.status === "resolved" &&
    !incident.resolved_at &&
    downtimeSeconds != null &&
    resolvedAtIso
  ) {
    try {
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", incident.project_id)
        .maybeSingle();
      const admin = createSupabaseAdminClient();
      const { dispatchNotification } = await import(
        "@/services/notifications"
      );
      const { formatDuration } = await import("@/utils/format");
      await dispatchNotification(admin, {
        userId,
        projectId: incident.project_id,
        type: "incident_resolved",
        projectName: project?.name ?? "Project",
        incidentId: incident.id,
        incidentTitle: incident.title,
        durationText: formatDuration(downtimeSeconds),
        resolvedAt: resolvedAtIso,
      });
    } catch {
      // Notification failure must not block the status update.
    }
  }

  return updated;
}
