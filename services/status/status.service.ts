import "server-only";

import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import {
  MONITORING,
  STATUS_COMPONENT_DESCRIPTIONS,
  STATUS_COMPONENT_KEYS,
  STATUS_COMPONENT_LABELS,
  UPTIME_WINDOWS,
  type StatusComponentKey,
  type UptimeWindowKey,
} from "@/lib/constants";
import { slugify } from "@/utils/string";
import {
  deriveComponentStatus,
  rollupOverallStatus,
} from "@/services/status/derive-components";
import { totalDowntimeMs, uptimePercent } from "@/services/status/uptime";
import type { DowntimeInterval } from "@/services/status/uptime";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { Database, StatusMaintenanceStatus } from "@/types/database";
import type {
  DayHistoryPoint,
  DayStatus,
  PublicComponent,
  PublicIncident,
  PublicMaintenance,
  PublicStatusDirectoryItem,
  PublicStatusPage,
  ResponsePoint,
  StatusPage,
  StatusPageComponent,
  StatusPageDetail,
  StatusPageListItem,
  StatusPageMaintenance,
} from "@/services/status/types";

type Supabase = TypedSupabaseClient;

const UNIQUE_VIOLATION = "23505";
const DAY_MS = 24 * 60 * 60 * 1000;

// --- Owner-scoped CRUD -----------------------------------------------------

export async function listStatusPages(
  supabase: Supabase,
  userId: string,
): Promise<StatusPageListItem[]> {
  const { data: pages, error } = await supabase
    .from("status_pages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw mapPostgrestError(error);

  const projectIds = [...new Set((pages ?? []).map((p) => p.project_id))];
  const names = new Map<string, { name: string; status: string }>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, status")
      .in("id", projectIds);
    for (const project of projects ?? []) {
      names.set(project.id, { name: project.name, status: project.status });
    }
  }

  return (pages ?? []).map((page) => ({
    page,
    projectName: names.get(page.project_id)?.name ?? "Project",
    projectStatus: names.get(page.project_id)?.status ?? "active",
  }));
}

export async function getStatusPageDetail(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<StatusPageDetail> {
  const { data: page, error } = await supabase
    .from("status_pages")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapPostgrestError(error);
  if (!page) throw new NotFoundError("Status page not found");

  const [{ data: project }, { data: components }, { data: maintenance }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("name")
        .eq("id", page.project_id)
        .maybeSingle(),
      supabase
        .from("status_page_components")
        .select("*")
        .eq("status_page_id", id)
        .order("position", { ascending: true }),
      supabase
        .from("status_page_maintenance")
        .select("*")
        .eq("status_page_id", id)
        .order("scheduled_start", { ascending: false }),
    ]);

  return {
    page,
    projectName: project?.name ?? "Project",
    components: components ?? [],
    maintenance: maintenance ?? [],
  };
}

export interface CreateStatusPageInput {
  projectId: string;
  name?: string;
  slug?: string;
  description?: string | null;
  isPublic?: boolean;
  logoUrl?: string | null;
  brandColor?: string;
  timezone?: string;
  contactEmail?: string | null;
  footerText?: string | null;
}

async function seedDefaultComponents(
  supabase: Supabase,
  page: StatusPage,
  userId: string,
): Promise<void> {
  const rows = STATUS_COMPONENT_KEYS.map((key, index) => ({
    status_page_id: page.id,
    project_id: page.project_id,
    user_id: userId,
    name: STATUS_COMPONENT_LABELS[key],
    description: STATUS_COMPONENT_DESCRIPTIONS[key],
    component_key: key,
    position: index,
  }));
  await supabase.from("status_page_components").insert(rows);
}

export async function createStatusPage(
  supabase: Supabase,
  userId: string,
  input: CreateStatusPageInput,
): Promise<StatusPage> {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, slug, workspace_id")
    .eq("user_id", userId)
    .eq("id", input.projectId)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!project) {
    throw new ForbiddenError("You do not have access to this project.");
  }

  let workspaceBrand: {
    logo_url: string | null;
    brand_color: string;
    timezone: string;
  } | null = null;
  const workspaceId = (project as { workspace_id?: string | null }).workspace_id;
  if (workspaceId) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("logo_url, brand_color, timezone")
      .eq("id", workspaceId)
      .maybeSingle();
    workspaceBrand = workspace;
  }

  const name = input.name?.trim() || `${project.name} Status`;
  const baseSlug =
    slugify(input.slug || project.slug || project.name) || "status";

  let attempt = 0;
  let slug = baseSlug;
  while (attempt < 6) {
    const { data, error } = await supabase
      .from("status_pages")
      .insert({
        project_id: input.projectId,
        user_id: userId,
        slug,
        name,
        description: input.description ?? null,
        is_public: input.isPublic ?? true,
        logo_url: input.logoUrl ?? workspaceBrand?.logo_url ?? null,
        brand_color:
          input.brandColor ?? workspaceBrand?.brand_color ?? "#3B82F6",
        timezone: input.timezone ?? workspaceBrand?.timezone ?? "UTC",
        contact_email: input.contactEmail ?? null,
        footer_text: input.footerText ?? null,
      })
      .select("*")
      .single();

    if (!error && data) {
      await seedDefaultComponents(supabase, data, userId);
      return data;
    }
    if (error?.code === UNIQUE_VIOLATION) {
      const existing = await getStatusPageForProject(
        supabase,
        userId,
        input.projectId,
      );
      if (existing) {
        throw new ConflictError("This project already has a status page.");
      }
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      attempt += 1;
      continue;
    }
    if (error) throw mapPostgrestError(error);
  }
  throw new ConflictError("Could not allocate a unique status page slug.");
}

export async function getStatusPageForProject(
  supabase: Supabase,
  userId: string,
  projectId: string,
): Promise<StatusPage | null> {
  const { data, error } = await supabase
    .from("status_pages")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw mapPostgrestError(error);
  return data;
}

export interface UpdateStatusPageInput {
  name?: string;
  slug?: string;
  description?: string | null;
  isPublic?: boolean;
  logoUrl?: string | null;
  brandColor?: string;
  timezone?: string;
  contactEmail?: string | null;
  footerText?: string | null;
}

export async function updateStatusPage(
  supabase: Supabase,
  userId: string,
  id: string,
  input: UpdateStatusPageInput,
): Promise<StatusPage> {
  const patch: Database["public"]["Tables"]["status_pages"]["Update"] = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description;
  if (input.isPublic !== undefined) patch.is_public = input.isPublic;
  if (input.slug !== undefined) patch.slug = slugify(input.slug) || "status";
  if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;
  if (input.brandColor !== undefined) patch.brand_color = input.brandColor;
  if (input.timezone !== undefined) patch.timezone = input.timezone;
  if (input.contactEmail !== undefined) patch.contact_email = input.contactEmail;
  if (input.footerText !== undefined) patch.footer_text = input.footerText;

  const { data, error } = await supabase
    .from("status_pages")
    .update(patch)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw mapPostgrestError(error, {
      uniqueConflictMessage: "That status page slug is already taken.",
    });
  }
  if (!data) throw new NotFoundError("Status page not found");
  return data;
}

export async function deleteStatusPage(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("status_pages")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw mapPostgrestError(error);
}

export interface AddComponentInput {
  statusPageId: string;
  name: string;
  description?: string | null;
  position?: number;
  componentKey?: string | null;
}

export async function addStatusPageComponent(
  supabase: Supabase,
  userId: string,
  input: AddComponentInput,
): Promise<StatusPageComponent> {
  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("id, project_id")
    .eq("user_id", userId)
    .eq("id", input.statusPageId)
    .maybeSingle();
  if (pageError) throw pageError;
  if (!page) throw new NotFoundError("Status page not found");

  const { count } = await supabase
    .from("status_page_components")
    .select("id", { count: "exact", head: true })
    .eq("status_page_id", page.id);

  const { data, error } = await supabase
    .from("status_page_components")
    .insert({
      status_page_id: page.id,
      project_id: page.project_id,
      user_id: userId,
      name: input.name.trim(),
      description: input.description ?? null,
      component_key: input.componentKey ?? null,
      position: input.position ?? count ?? 0,
    })
    .select("*")
    .single();
  if (error) throw mapPostgrestError(error);
  return data;
}

export async function deleteStatusPageComponent(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("status_page_components")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw mapPostgrestError(error);
}

export interface UpsertMaintenanceInput {
  statusPageId: string;
  title: string;
  description?: string | null;
  status: StatusMaintenanceStatus;
  scheduledStart: string;
  scheduledEnd: string;
}

export async function createMaintenance(
  supabase: Supabase,
  userId: string,
  input: UpsertMaintenanceInput,
): Promise<StatusPageMaintenance> {
  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("id, project_id")
    .eq("user_id", userId)
    .eq("id", input.statusPageId)
    .maybeSingle();
  if (pageError) throw pageError;
  if (!page) throw new NotFoundError("Status page not found");

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("status_page_maintenance")
    .insert({
      status_page_id: page.id,
      project_id: page.project_id,
      user_id: userId,
      title: input.title.trim(),
      description: input.description ?? null,
      status: input.status,
      scheduled_start: input.scheduledStart,
      scheduled_end: input.scheduledEnd,
      started_at: input.status === "in_progress" ? now : null,
      completed_at:
        input.status === "completed" || input.status === "cancelled"
          ? now
          : null,
    })
    .select("*")
    .single();
  if (error) throw mapPostgrestError(error);
  return data;
}

export async function updateMaintenance(
  supabase: Supabase,
  userId: string,
  id: string,
  input: Partial<UpsertMaintenanceInput> & { status?: StatusMaintenanceStatus },
): Promise<StatusPageMaintenance> {
  const patch: Database["public"]["Tables"]["status_page_maintenance"]["Update"] =
    {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description;
  if (input.scheduledStart !== undefined) {
    patch.scheduled_start = input.scheduledStart;
  }
  if (input.scheduledEnd !== undefined) patch.scheduled_end = input.scheduledEnd;
  if (input.status !== undefined) {
    patch.status = input.status;
    const now = new Date().toISOString();
    if (input.status === "in_progress") patch.started_at = now;
    if (input.status === "completed" || input.status === "cancelled") {
      patch.completed_at = now;
    }
  }

  const { data, error } = await supabase
    .from("status_page_maintenance")
    .update(patch)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw mapPostgrestError(error);
  if (!data) throw new NotFoundError("Maintenance window not found");
  return data;
}

export async function deleteMaintenance(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("status_page_maintenance")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw mapPostgrestError(error);
}

// --- Public aggregation ----------------------------------------------------

function dayStatusFor(downtimeSeconds: number): DayStatus {
  if (downtimeSeconds <= 0) return "operational";
  if (downtimeSeconds < 3600) return "degraded";
  return "down";
}

function toPublicMaintenance(row: StatusPageMaintenance): PublicMaintenance {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

function recoverySeconds(
  startedAt: string,
  resolvedAt: string | null,
  downtimeSeconds: number | null,
): number | null {
  if (downtimeSeconds !== null) return downtimeSeconds;
  if (!resolvedAt) return null;
  return Math.max(
    0,
    Math.floor((Date.parse(resolvedAt) - Date.parse(startedAt)) / 1000),
  );
}

export async function listPublicStatusDirectory(
  admin: Supabase,
): Promise<PublicStatusDirectoryItem[]> {
  const { data: pages } = await admin
    .from("status_pages")
    .select("id, slug, name, description, project_id, brand_color")
    .eq("is_public", true)
    .order("name", { ascending: true });

  if (!pages || pages.length === 0) return [];

  const items: PublicStatusDirectoryItem[] = [];
  for (const page of pages) {
    const publicPage = await getPublicStatusPage(admin, page.slug);
    if (!publicPage) continue;
    items.push({
      slug: publicPage.slug,
      name: publicPage.name,
      projectName: publicPage.projectName,
      description: publicPage.description,
      currentStatus: publicPage.currentStatus,
      currentUptime: publicPage.currentUptime,
      brandColor: publicPage.brandColor,
    });
  }
  return items;
}

export async function listPublicStatusSlugs(
  admin: Supabase,
): Promise<string[]> {
  const { data } = await admin
    .from("status_pages")
    .select("slug")
    .eq("is_public", true);
  return (data ?? []).map((row) => row.slug);
}

/**
 * Aggregates the full public status page payload for a slug. Uses the
 * service-role client so it can read owner-scoped incidents and performance
 * data; only safe, public-facing fields are returned.
 */
export async function getPublicStatusPage(
  admin: Supabase,
  slug: string,
): Promise<PublicStatusPage | null> {
  const { data: page } = await admin
    .from("status_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (!page) return null;

  const { data: project } = await admin
    .from("projects")
    .select("name, created_at")
    .eq("id", page.project_id)
    .maybeSingle();
  const projectName = project?.name ?? page.name;
  const projectCreatedMs = project?.created_at
    ? Date.parse(project.created_at)
    : 0;

  const now = Date.now();
  const windowStart90 = new Date(now - UPTIME_WINDOWS["90d"]).toISOString();
  const recentErrorsSince = new Date(now - UPTIME_WINDOWS["24h"]).toISOString();

  const [
    { data: recent },
    { data: open },
    { data: componentRows },
    { data: maintenanceRows },
    { data: heartbeatRows },
    { data: recentErrors },
    { data: failedNotifs },
  ] = await Promise.all([
    admin
      .from("incidents")
      .select(
        "id, title, status, severity, started_at, resolved_at, downtime_seconds",
      )
      .eq("project_id", page.project_id)
      .gte("started_at", windowStart90)
      .order("started_at", { ascending: false }),
    admin
      .from("incidents")
      .select(
        "id, title, status, severity, started_at, resolved_at, downtime_seconds",
      )
      .eq("project_id", page.project_id)
      .neq("status", "resolved"),
    admin
      .from("status_page_components")
      .select("*")
      .eq("status_page_id", page.id)
      .order("position", { ascending: true }),
    admin
      .from("status_page_maintenance")
      .select("*")
      .eq("status_page_id", page.id)
      .order("scheduled_start", { ascending: false }),
    admin
      .from("heartbeats")
      .select("occurred_at")
      .eq("project_id", page.project_id)
      .order("occurred_at", { ascending: false })
      .limit(1),
    admin
      .from("errors")
      .select("id, level, message, type")
      .eq("project_id", page.project_id)
      .gte("last_seen", recentErrorsSince)
      .limit(200),
    admin
      .from("notification_logs")
      .select("id")
      .eq("project_id", page.project_id)
      .eq("status", "failed")
      .gte("created_at", recentErrorsSince)
      .limit(50),
  ]);

  const incidentIds = [
    ...new Set([
      ...(recent ?? []).map((r) => r.id),
      ...(open ?? []).map((r) => r.id),
    ]),
  ];

  const { data: updates } =
    incidentIds.length > 0
      ? await admin
          .from("incident_updates")
          .select("id, incident_id, message, status, created_at")
          .in("incident_id", incidentIds)
          .order("created_at", { ascending: true })
      : { data: [] as Array<{
          id: string;
          incident_id: string;
          message: string;
          status: Database["public"]["Tables"]["incident_updates"]["Row"]["status"];
          created_at: string;
        }> };

  const updatesByIncident = new Map<
    string,
    PublicIncident["timeline"]
  >();
  for (const update of updates ?? []) {
    const list = updatesByIncident.get(update.incident_id) ?? [];
    list.push({
      id: update.id,
      message: update.message,
      status: update.status,
      createdAt: update.created_at,
    });
    updatesByIncident.set(update.incident_id, list);
  }

  const incidentMap = new Map<string, PublicIncident>();
  for (const row of [...(recent ?? []), ...(open ?? [])]) {
    incidentMap.set(row.id, {
      id: row.id,
      title: row.title,
      status: row.status,
      severity: row.severity,
      startedAt: row.started_at,
      resolvedAt: row.resolved_at,
      downtimeSeconds: row.downtime_seconds,
      recoverySeconds: recoverySeconds(
        row.started_at,
        row.resolved_at,
        row.downtime_seconds,
      ),
      projectName,
      timeline: updatesByIncident.get(row.id) ?? [],
    });
  }
  const incidents = [...incidentMap.values()].sort(
    (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
  );
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  const intervals: DowntimeInterval[] = incidents.map((incident) => ({
    start: Date.parse(incident.startedAt),
    end: incident.resolvedAt ? Date.parse(incident.resolvedAt) : now,
  }));

  const uptime = {} as Record<UptimeWindowKey, number>;
  for (const key of Object.keys(UPTIME_WINDOWS) as UptimeWindowKey[]) {
    uptime[key] = uptimePercent(intervals, now - UPTIME_WINDOWS[key], now);
  }
  const currentUptime = uptime["24h"];

  const todayStart = Math.floor(now / DAY_MS) * DAY_MS;
  const history: DayHistoryPoint[] = [];
  for (let k = MONITORING.statusHistoryDays - 1; k >= 0; k -= 1) {
    const dayStart = todayStart - k * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    if (projectCreatedMs > 0 && dayEnd <= projectCreatedMs) {
      history.push({
        date: new Date(dayStart).toISOString().slice(0, 10),
        status: "no_data",
        downtimeSeconds: 0,
        uptimePercent: 100,
      });
      continue;
    }
    const windowEnd = Math.min(dayEnd, now);
    const downtimeSeconds = Math.floor(
      totalDowntimeMs(intervals, dayStart, windowEnd) / 1000,
    );
    history.push({
      date: new Date(dayStart).toISOString().slice(0, 10),
      status: dayStatusFor(downtimeSeconds),
      downtimeSeconds,
      uptimePercent: uptimePercent(intervals, dayStart, windowEnd),
    });
  }

  const { data: perf } = await admin
    .from("performance_logs")
    .select("occurred_at, page_load")
    .eq("project_id", page.project_id)
    .gte("occurred_at", windowStart90)
    .order("occurred_at", { ascending: true })
    .limit(10000);

  const perfByDay = new Map<string, { sum: number; count: number }>();
  let perfSum = 0;
  let perfCount = 0;
  for (const row of perf ?? []) {
    if (row.page_load === null || row.page_load === undefined) continue;
    const date = new Date(row.occurred_at).toISOString().slice(0, 10);
    const bucket = perfByDay.get(date) ?? { sum: 0, count: 0 };
    bucket.sum += row.page_load;
    bucket.count += 1;
    perfByDay.set(date, bucket);
    perfSum += row.page_load;
    perfCount += 1;
  }
  const responseSeries: ResponsePoint[] = history.map((point) => {
    const bucket = perfByDay.get(point.date);
    return {
      date: point.date,
      avgMs: bucket ? Math.round(bucket.sum / bucket.count) : null,
    };
  });
  const avgResponseMs = perfCount > 0 ? Math.round(perfSum / perfCount) : null;

  const maintenance = (maintenanceRows ?? []).map(toPublicMaintenance);
  const upcomingMaintenance = maintenance.filter(
    (item) =>
      item.status === "scheduled" || item.status === "in_progress",
  );
  const maintenanceActive = maintenance.some(
    (item) => item.status === "in_progress",
  );

  const latestHeartbeat = heartbeatRows?.[0];
  const heartbeatAgeMs = latestHeartbeat?.occurred_at
    ? now - Date.parse(latestHeartbeat.occurred_at)
    : null;
  const fatalErrors = (recentErrors ?? []).filter(
    (e) => e.level === "fatal",
  ).length;
  const authFailures = (recentErrors ?? []).filter((e) => {
    const hay = `${e.message ?? ""} ${e.type ?? ""}`.toLowerCase();
    return (
      hay.includes("auth") ||
      hay.includes("unauthorized") ||
      hay.includes("forbidden") ||
      hay.includes("login")
    );
  }).length;
  const aiFailures = (recentErrors ?? []).filter((e) => {
    const hay = `${e.message ?? ""} ${e.type ?? ""}`.toLowerCase();
    return (
      hay.includes("openai") ||
      hay.includes("ai ") ||
      hay.includes("llm") ||
      hay.includes("assistant")
    );
  }).length;

  const signals = {
    openIncidents: activeIncidents.map((i) => ({
      severity: i.severity,
      status: i.status,
    })),
    heartbeatAgeMs,
    recentFatalErrors: fatalErrors,
    recentErrors: (recentErrors ?? []).length,
    avgPageLoadMs: avgResponseMs,
    failedNotifications: (failedNotifs ?? []).length,
    aiFailures,
    authFailures,
    maintenanceActive,
  };

  let components: PublicComponent[] = (componentRows ?? []).map((row) => {
    const key = (STATUS_COMPONENT_KEYS as readonly string[]).includes(
      row.component_key ?? "",
    )
      ? (row.component_key as StatusComponentKey)
      : "custom";
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      key,
      status: deriveComponentStatus(key, signals),
    };
  });

  if (components.length === 0) {
    components = STATUS_COMPONENT_KEYS.map((key) => ({
      id: key,
      name: STATUS_COMPONENT_LABELS[key],
      description: STATUS_COMPONENT_DESCRIPTIONS[key],
      key,
      status: deriveComponentStatus(key, signals),
    }));
  }

  const currentStatus = rollupOverallStatus(
    components.map((c) => c.status),
    signals.openIncidents,
    maintenanceActive,
  );

  return {
    id: page.id,
    slug: page.slug,
    name: page.name,
    description: page.description,
    projectName,
    projectId: page.project_id,
    logoUrl: page.logo_url,
    brandColor: page.brand_color,
    timezone: page.timezone,
    contactEmail: page.contact_email,
    footerText: page.footer_text,
    currentStatus,
    currentUptime,
    uptime,
    history,
    activeIncidents,
    resolvedIncidents,
    incidents,
    maintenance,
    upcomingMaintenance,
    responseSeries,
    avgResponseMs,
    components,
    updatedAt: new Date(now).toISOString(),
  };
}

export function exportStatusPageJson(data: PublicStatusPage): string {
  return JSON.stringify(data, null, 2);
}

export function exportStatusPageCsv(data: PublicStatusPage): string {
  const header = [
    "kind",
    "id",
    "title",
    "status",
    "severity",
    "project",
    "started_at",
    "resolved_at",
    "recovery_seconds",
  ];
  const rows = data.incidents.map((incident) =>
    [
      "incident",
      incident.id,
      csvEscape(incident.title),
      incident.status,
      incident.severity,
      csvEscape(incident.projectName),
      incident.startedAt,
      incident.resolvedAt ?? "",
      incident.recoverySeconds ?? "",
    ].join(","),
  );
  for (const item of data.maintenance) {
    rows.push(
      [
        "maintenance",
        item.id,
        csvEscape(item.title),
        item.status,
        "",
        csvEscape(data.projectName),
        item.scheduledStart,
        item.scheduledEnd,
        "",
      ].join(","),
    );
  }
  return [header.join(","), ...rows].join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
