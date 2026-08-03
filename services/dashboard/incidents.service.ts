import { emptyPage, createPage, normalizePagination } from "@/services/dashboard/pagination";
import { getAuthenticatedUser } from "@/services/auth";
import { NotFoundError } from "@/lib/errors";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import {
  countOpenIncidents,
  listIncidents as listUserIncidents,
  getIncidentById,
  type ListIncidentsParams,
} from "@/services/incidents";
import { createSupabaseServerClient } from "@/supabase/server";
import type { ApiKeyEnvironment } from "@/types/database";
import type { Incident, Paginated } from "@/types/dashboard";
import type {
  EnrichedTimelineEvent,
  IncidentDetailBundle,
  RootCauseAnalysis,
} from "@/features/incidents/types";

export interface DashboardListIncidentsParams extends ListIncidentsParams {
  environment?: ApiKeyEnvironment;
}

function durationSeconds(
  startedAt: string,
  resolvedAt: string | null,
  downtimeSeconds: number | null,
): number {
  if (downtimeSeconds != null) return downtimeSeconds;
  if (resolvedAt) {
    return Math.max(
      0,
      Math.floor(
        (new Date(resolvedAt).getTime() - new Date(startedAt).getTime()) / 1000,
      ),
    );
  }
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );
}

function aiRecommendationFor(input: {
  source: string;
  status: string;
  severity: string;
}): string | null {
  if (input.status === "resolved") {
    return "Review postmortem signals and confirm monitoring coverage.";
  }
  if (input.source === "monitor") {
    return "Investigate heartbeat gap, recent deploys, and hosting health.";
  }
  if (input.severity === "critical" || input.severity === "high") {
    return "Prioritize root-cause checks and notify stakeholders.";
  }
  return "Triage related errors and confirm service impact.";
}

/**
 * Dashboard seam for incidents. Reads the current user's incidents and maps
 * them to the dashboard view model with project/environment context.
 */
export async function listIncidents(
  params: DashboardListIncidentsParams = {},
): Promise<Paginated<Incident>> {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return emptyPage<Incident>(params);
    }

    const result = await listUserIncidents(supabase, user.id, params);
    const projectIds = [...new Set(result.items.map((r) => r.project_id))];

    const projectNames = new Map<string, string>();
    const envByProject = new Map<string, string>();

    if (projectIds.length === 0) {
      return {
        items: [],
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      };
    }

    const [{ data: projects }, { data: heartbeats }, { data: profile }] =
      await Promise.all([
        supabase.from("projects").select("id, name").in("id", projectIds),
        supabase
          .from("heartbeats")
          .select("project_id, environment, occurred_at")
          .eq("user_id", user.id)
          .in("project_id", projectIds)
          .order("occurred_at", { ascending: false })
          .limit(200),
        supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

    for (const p of projects ?? []) {
      projectNames.set(p.id, p.name);
    }
    for (const h of heartbeats ?? []) {
      if (!envByProject.has(h.project_id)) {
        envByProject.set(h.project_id, h.environment);
      }
    }

    const assignee =
      profile?.full_name?.trim() ||
      profile?.email?.trim() ||
      "Workspace owner";

    let items: Incident[] = result.items.map((row) => {
      const environment = envByProject.get(row.project_id) ?? null;
      return {
        id: row.id,
        title: row.title,
        status: row.status,
        severity: row.severity,
        projectId: row.project_id,
        projectName: projectNames.get(row.project_id) ?? "Project",
        environment,
        startedAt: row.started_at,
        resolvedAt: row.resolved_at,
        downtimeSeconds: row.downtime_seconds,
        durationSeconds: durationSeconds(
          row.started_at,
          row.resolved_at,
          row.downtime_seconds,
        ),
        assignee: row.source === "monitor" ? "Monitor" : assignee,
        aiRecommendation: aiRecommendationFor({
          source: row.source,
          status: row.status,
          severity: row.severity,
        }),
        source: row.source,
      };
    });

    if (params.environment) {
      items = items.filter((i) => i.environment === params.environment);
      const pagination = normalizePagination(params);
      return createPage(items, items.length, pagination);
    }

    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  } catch {
    return emptyPage<Incident>(params);
  }
}

/** Count of currently open (unresolved) incidents. */
export async function getOpenIncidentCount(): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return 0;
    }
    return await countOpenIncidents(supabase, user.id);
  } catch {
    return 0;
  }
}

function buildRootCause(input: {
  source: string;
  description: string | null;
  lastHeartbeatAt: string | null;
  errorCount: number;
  notificationCount: number;
  fatalErrors: number;
  status: string;
}): RootCauseAnalysis {
  const evidence: string[] = [];
  const relatedEvents: string[] = [];
  const recommendations: string[] = [];
  let possibleCause = "Impact confirmed; root cause still under investigation.";
  let confidence = 45;

  if (input.source === "monitor") {
    possibleCause =
      "Service outage likely caused by missing heartbeats (hosting, process crash, or network partition).";
    confidence = 72;
    evidence.push("Incident opened by automated heartbeat monitor");
    if (input.lastHeartbeatAt) {
      evidence.push(`Last heartbeat at ${input.lastHeartbeatAt}`);
    }
    recommendations.push("Verify hosting/runtime status and recent deploys");
    recommendations.push("Confirm SDK heartbeat collector is still running");
  }

  if (input.fatalErrors > 0) {
    possibleCause =
      "Elevated fatal/error volume around the incident window suggests application failures contributed.";
    confidence = Math.min(90, confidence + 12);
    evidence.push(`${input.fatalErrors} fatal/error group(s) in the window`);
    recommendations.push("Inspect top related errors and stack traces");
  }

  if (input.errorCount > 0) {
    relatedEvents.push(`${input.errorCount} related error group(s)`);
  }
  if (input.notificationCount > 0) {
    relatedEvents.push(`${input.notificationCount} notification(s) dispatched`);
  }
  if (input.description) {
    evidence.push(input.description);
  }
  if (input.status === "resolved") {
    recommendations.push("Capture a short postmortem and verify monitoring gaps");
    confidence = Math.min(95, confidence + 5);
  } else {
    recommendations.push("Update incident status as evidence is confirmed");
  }

  return {
    possibleCause,
    confidence,
    evidence,
    relatedEvents,
    recommendations,
  };
}

/** Full incident detail with related telemetry and enriched timeline. */
export async function getIncidentDetail(
  id: string,
): Promise<IncidentDetailBundle> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    throw new NotFoundError("Incident not found");
  }

  const { incident, updates } = await getIncidentById(supabase, user.id, id);

  const windowStart = new Date(
    new Date(incident.started_at).getTime() - 2 * 60 * 60 * 1000,
  ).toISOString();
  const windowEnd = new Date(
    (incident.resolved_at
      ? new Date(incident.resolved_at).getTime()
      : Date.now()) +
      2 * 60 * 60 * 1000,
  ).toISOString();

  const [
    projectRes,
    profileRes,
    errorsRes,
    hbRes,
    notifRes,
    perfRes,
    keysRes,
    aiRes,
    histRes,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("name")
      .eq("id", incident.project_id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("errors")
      .select("id, message, level, occurrences, last_seen")
      .eq("user_id", user.id)
      .eq("project_id", incident.project_id)
      .gte("last_seen", windowStart)
      .lte("last_seen", windowEnd)
      .order("last_seen", { ascending: false })
      .limit(10),
    supabase
      .from("heartbeats")
      .select("id, occurred_at, environment, release, page")
      .eq("user_id", user.id)
      .eq("project_id", incident.project_id)
      .gte("occurred_at", windowStart)
      .lte("occurred_at", windowEnd)
      .order("occurred_at", { ascending: false })
      .limit(12),
    supabase
      .from("notification_logs")
      .select("id, title, type, channel, created_at, data")
      .eq("user_id", user.id)
      .eq("project_id", incident.project_id)
      .gte("created_at", windowStart)
      .lte("created_at", windowEnd)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("performance_logs")
      .select("id, occurred_at, url, lcp, ttfb, page_load")
      .eq("user_id", user.id)
      .eq("project_id", incident.project_id)
      .gte("occurred_at", windowStart)
      .lte("occurred_at", windowEnd)
      .order("occurred_at", { ascending: false })
      .limit(8),
    supabase
      .from("api_keys")
      .select("id, name, key_prefix, environment, last_used_at")
      .eq("user_id", user.id)
      .eq("project_id", incident.project_id)
      .eq("status", "active")
      .order("last_used_at", { ascending: false, nullsFirst: false })
      .limit(5),
    supabase
      .from("ai_conversations")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .eq("project_id", incident.project_id)
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("incidents")
      .select("downtime_seconds, resolved_at, started_at")
      .eq("user_id", user.id)
      .eq("project_id", incident.project_id)
      .eq("status", "resolved")
      .not("downtime_seconds", "is", null)
      .order("resolved_at", { ascending: false })
      .limit(50),
  ]);

  const relatedErrors = (errorsRes.data ?? []).map((e) => ({
    id: e.id,
    message: e.message,
    level: e.level,
    occurrences: e.occurrences,
    lastSeenAt: e.last_seen,
  }));

  const relatedHeartbeats = (hbRes.data ?? []).map((h) => ({
    id: h.id,
    occurredAt: h.occurred_at,
    environment: h.environment,
    release: h.release,
    page: h.page,
  }));

  const relatedNotifications = (notifRes.data ?? [])
    .filter((n) => {
      const data = n.data as Record<string, unknown> | null;
      if (!data) return true;
      if (data.incidentId && data.incidentId !== incident.id) return false;
      return (
        n.type === "incident_created" ||
        n.type === "incident_resolved" ||
        data.incidentId === incident.id
      );
    })
    .map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      channel: n.channel,
      createdAt: n.created_at,
    }));

  const relatedPerformance = (perfRes.data ?? []).map((p) => ({
    id: p.id,
    occurredAt: p.occurred_at,
    url: p.url,
    lcp: p.lcp,
    ttfb: p.ttfb,
    pageLoad: p.page_load,
  }));

  const relatedApiKeys = (keysRes.data ?? []).map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.key_prefix,
    environment: k.environment,
    lastUsedAt: k.last_used_at,
  }));

  const relatedAi = (aiRes.data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updated_at,
  }));

  const hist = histRes.data ?? [];
  const histDowntimes = hist
    .map((h) => h.downtime_seconds)
    .filter((v): v is number => v != null && v >= 0);
  const averageRecoverySeconds =
    histDowntimes.length > 0
      ? Math.round(
          histDowntimes.reduce((a, b) => a + b, 0) / histDowntimes.length,
        )
      : null;

  const environment =
    relatedHeartbeats[0]?.environment ??
    relatedApiKeys[0]?.environment ??
    null;

  const assigneeName =
    profileRes.data?.full_name?.trim() ||
    profileRes.data?.email?.trim() ||
    "Workspace owner";

  const rootCause = buildRootCause({
    source: incident.source,
    description: incident.description,
    lastHeartbeatAt: incident.last_heartbeat_at,
    errorCount: relatedErrors.length,
    notificationCount: relatedNotifications.length,
    fatalErrors: relatedErrors.filter(
      (e) => e.level === "fatal" || e.level === "error",
    ).length,
    status: incident.status,
  });

  const timeline: EnrichedTimelineEvent[] = [
    {
      id: "created",
      at: incident.started_at,
      title: "Incident created",
      detail: incident.description ?? undefined,
      kind: "created",
      tone: "danger",
    },
  ];

  if (incident.last_heartbeat_at) {
    timeline.push({
      id: "hb-lost",
      at: incident.last_heartbeat_at,
      title: "Heartbeat lost",
      detail: "Last successful heartbeat before the outage window",
      kind: "heartbeat",
      tone: "warning",
    });
  }

  for (const err of relatedErrors.slice(0, 5)) {
    timeline.push({
      id: `err-${err.id}`,
      at: err.lastSeenAt,
      title: "Errors detected",
      detail: err.message,
      kind: "error",
      tone: "danger",
    });
  }

  for (const n of relatedNotifications.slice(0, 5)) {
    timeline.push({
      id: `notif-${n.id}`,
      at: n.createdAt,
      title: "Notifications sent",
      detail: `${n.title} · ${n.channel}`,
      kind: "notification",
      tone: "primary",
    });
  }

  for (const ai of relatedAi) {
    timeline.push({
      id: `ai-${ai.id}`,
      at: ai.updatedAt,
      title: "AI analysis",
      detail: ai.title,
      kind: "ai",
      tone: "primary",
    });
  }

  for (const update of updates) {
    if (update.status) {
      timeline.push({
        id: `status-${update.id}`,
        at: update.created_at,
        title: `Status changed: ${update.status}`,
        detail: update.message,
        kind: update.status === "resolved" ? "resolved" : "status",
        tone: update.status === "resolved" ? "success" : "warning",
      });
    } else {
      timeline.push({
        id: `comment-${update.id}`,
        at: update.created_at,
        title: "Comment",
        detail: update.message,
        kind: "comment",
        tone: "default",
      });
    }
  }

  if (incident.resolved_at) {
    timeline.push({
      id: "recovery",
      at: incident.resolved_at,
      title: "Recovery complete",
      detail: incident.auto_resolved
        ? "Automatically resolved when heartbeats resumed"
        : "Manually marked resolved",
      kind: "recovery",
      tone: "success",
    });
  }

  timeline.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  const analyzePrompt = [
    `Analyze this incident with root cause, confidence, related signals, and recovery recommendations.`,
    ``,
    `Incident ID: ${incident.id}`,
    `Title: ${incident.title}`,
    `Severity: ${incident.severity}`,
    `Status: ${incident.status}`,
    `Source: ${incident.source}`,
    `Started: ${incident.started_at}`,
    incident.description ? `Description: ${incident.description}` : "",
    `Possible cause: ${rootCause.possibleCause}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    incident: {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      status: incident.status,
      severity: incident.severity,
      source: incident.source,
      projectId: incident.project_id,
      projectName: projectRes.data?.name ?? "Project",
      environment,
      startedAt: incident.started_at,
      detectedAt: incident.detected_at,
      resolvedAt: incident.resolved_at,
      downtimeSeconds: incident.downtime_seconds,
      lastHeartbeatAt: incident.last_heartbeat_at,
      autoResolved: incident.auto_resolved,
      assignee: incident.source === "monitor" ? "Monitor" : assigneeName,
    },
    updates: updates.map((u) => ({
      id: u.id,
      status: u.status,
      message: u.message,
      createdAt: u.created_at,
    })),
    timeline,
    relatedErrors,
    relatedHeartbeats,
    relatedNotifications,
    relatedPerformance,
    relatedApiKeys,
    relatedAi,
    rootCause,
    recovery: {
      downtimeSeconds: incident.downtime_seconds,
      recoverySeconds: incident.downtime_seconds,
      averageRecoverySeconds,
      historicalCount: histDowntimes.length,
    },
    aiAnalyzeHref: `${DASHBOARD_ROUTES.aiAssistant}?intent=analyze-incident&project=${incident.project_id}&q=${encodeURIComponent(analyzePrompt)}`,
  };
}

/** Export incidents matching filters as CSV. */
export async function exportIncidentsCsv(
  params: DashboardListIncidentsParams = {},
): Promise<string> {
  const page = await listIncidents({ ...params, page: 1, pageSize: 500 });
  const header = [
    "id",
    "title",
    "status",
    "severity",
    "project",
    "environment",
    "started_at",
    "resolved_at",
    "duration_seconds",
    "assignee",
    "source",
    "ai_recommendation",
  ];
  const rows = page.items.map((i) =>
    [
      i.id,
      csvEscape(i.title),
      i.status,
      i.severity,
      csvEscape(i.projectName),
      i.environment ?? "",
      i.startedAt,
      i.resolvedAt ?? "",
      i.durationSeconds,
      csvEscape(i.assignee),
      i.source,
      csvEscape(i.aiRecommendation ?? ""),
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export async function exportIncidentsJson(
  params: DashboardListIncidentsParams = {},
): Promise<string> {
  const page = await listIncidents({ ...params, page: 1, pageSize: 500 });
  return JSON.stringify(page.items, null, 2);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
