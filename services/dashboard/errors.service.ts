import { emptyPage, createPage, normalizePagination } from "@/services/dashboard/pagination";
import { getAuthenticatedUser } from "@/services/auth";
import { NotFoundError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/supabase/server";
import type { ApiKeyEnvironment, EventLevel, Json } from "@/types/database";
import type {
  ErrorEvent,
  ErrorLevel,
  Paginated,
  PaginationParams,
} from "@/types/dashboard";
import type {
  ErrorAnalytics,
  ErrorDetail,
  ErrorDetailBundle,
  ErrorTimelineEvent,
  RelatedErrorSummary,
  RelatedIncidentSummary,
} from "@/features/errors/types";

export type {
  ErrorAnalytics,
  ErrorDetail,
  ErrorDetailBundle,
  ErrorTimelineEvent,
  RelatedErrorSummary,
  RelatedIncidentSummary,
} from "@/features/errors/types";

export interface ListErrorsParams extends Partial<PaginationParams> {
  search?: string;
  level?: EventLevel;
  environment?: ApiKeyEnvironment;
  projectId?: string;
  release?: string;
  /** ISO date lower bound on last_seen */
  from?: string;
  /** ISO date upper bound on last_seen */
  to?: string;
  /**
   * Activity proxy (no resolve column in schema):
   * - unresolved = seen in last 7 days
   * - resolved = not seen in last 7 days
   */
  activity?: "unresolved" | "resolved";
}

function asLevel(value: string): ErrorLevel {
  if (
    value === "fatal" ||
    value === "error" ||
    value === "warning" ||
    value === "info" ||
    value === "debug"
  ) {
    return value;
  }
  return "error";
}

function sourceLabel(
  projectName: string | undefined,
  url: string | null,
): string {
  if (projectName) return projectName;
  if (!url) return "Unknown";
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

function jsonString(
  value: Json | null | undefined,
  keys: string[],
): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const v = record[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function sanitizeSearch(value: string): string {
  return value.replace(/[%_,.()]/g, " ").trim();
}

function mapErrorRow(row: {
  id: string;
  project_id: string;
  message: string;
  level: string;
  type: string | null;
  url: string | null;
  fingerprint: string;
  occurrences: number;
  environment: string;
  release: string | null;
  first_seen: string;
  last_seen: string;
  projects?:
    | { name?: string; framework?: string }
    | { name?: string; framework?: string }[]
    | null;
}): ErrorEvent {
  const project = row.projects;
  const projectMeta = Array.isArray(project) ? project[0] : project;
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: projectMeta?.name ?? "Project",
    message: row.message,
    level: asLevel(row.level),
    type: row.type,
    url: row.url,
    fingerprint: row.fingerprint,
    occurrences: row.occurrences,
    environment: row.environment,
    release: row.release,
    firstSeenAt: row.first_seen,
    lastSeenAt: row.last_seen,
    source: sourceLabel(projectMeta?.name, row.url),
  };
}

/**
 * Lists captured error groups for error monitoring.
 * Reads the authenticated user's `errors` table via RLS.
 */
export async function listErrors(
  params: ListErrorsParams = {},
): Promise<Paginated<ErrorEvent>> {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return emptyPage<ErrorEvent>(params);
    }

    const pagination = normalizePagination(params);
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;

    let query = supabase
      .from("errors")
      .select(
        "id, project_id, message, level, type, url, fingerprint, occurrences, environment, release, first_seen, last_seen",
        { count: "exact" },
      )
      .eq("user_id", user.id);

    const search = sanitizeSearch(params.search ?? "");
    if (search) {
      const { data: matchingProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .or(`name.ilike.%${search}%,framework.ilike.%${search}%`)
        .limit(30);
      const projectIds = (matchingProjects ?? []).map((p) => p.id);
      const parts = [
        `message.ilike.%${search}%`,
        `url.ilike.%${search}%`,
        `release.ilike.%${search}%`,
        `fingerprint.ilike.%${search}%`,
        `type.ilike.%${search}%`,
        `browser->>name.ilike.%${search}%`,
      ];
      if (projectIds.length > 0) {
        parts.push(`project_id.in.(${projectIds.join(",")})`);
      }
      query = query.or(parts.join(","));
    }
    if (params.level) query = query.eq("level", params.level);
    if (params.environment) query = query.eq("environment", params.environment);
    if (params.projectId) query = query.eq("project_id", params.projectId);
    if (params.release) {
      const release = sanitizeSearch(params.release);
      if (release) query = query.ilike("release", `%${release}%`);
    }
    if (params.from) query = query.gte("last_seen", params.from);
    if (params.to) query = query.lte("last_seen", params.to);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    if (params.activity === "unresolved") {
      query = query.gte("last_seen", weekAgo);
    } else if (params.activity === "resolved") {
      query = query.lt("last_seen", weekAgo);
    }

    const { data, error, count } = await query
      .order("last_seen", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    const rows = data ?? [];
    const projectIds = [...new Set(rows.map((r) => r.project_id))];
    const projectNames = new Map<string, string>();
    if (projectIds.length > 0) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .in("id", projectIds);
      for (const p of projects ?? []) {
        projectNames.set(p.id, p.name);
      }
    }

    const items = rows.map((row) =>
      mapErrorRow({
        ...row,
        projects: { name: projectNames.get(row.project_id) },
      }),
    );
    return createPage(items, count ?? 0, pagination);
  } catch {
    return emptyPage<ErrorEvent>(params);
  }
}

/** Recent error groups for the dashboard home widget. */
export async function getRecentErrors(limit = 5): Promise<ErrorEvent[]> {
  const page = await listErrors({ page: 1, pageSize: limit });
  return page.items;
}

/** Aggregate counts for the Error Analytics strip on the list page. */
export async function getErrorAnalytics(): Promise<ErrorAnalytics> {
  const empty: ErrorAnalytics = {
    totalGroups: 0,
    totalOccurrences: 0,
    byLevel: [],
    byEnvironment: [],
    unresolvedCount: 0,
    resolvedCount: 0,
  };

  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return empty;

    const { data, error } = await supabase
      .from("errors")
      .select("level, environment, occurrences, last_seen")
      .eq("user_id", user.id)
      .limit(2000);

    if (error || !data) return empty;

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const levelMap = new Map<ErrorLevel, number>();
    const envMap = new Map<string, number>();
    let totalOccurrences = 0;
    let unresolvedCount = 0;
    let resolvedCount = 0;

    for (const row of data) {
      const level = asLevel(row.level);
      levelMap.set(level, (levelMap.get(level) ?? 0) + 1);
      envMap.set(row.environment, (envMap.get(row.environment) ?? 0) + 1);
      totalOccurrences += row.occurrences;
      if (new Date(row.last_seen).getTime() >= weekAgo) {
        unresolvedCount += 1;
      } else {
        resolvedCount += 1;
      }
    }

    return {
      totalGroups: data.length,
      totalOccurrences,
      byLevel: [...levelMap.entries()]
        .map(([level, count]) => ({ level, count }))
        .sort((a, b) => b.count - a.count),
      byEnvironment: [...envMap.entries()]
        .map(([environment, count]) => ({ environment, count }))
        .sort((a, b) => b.count - a.count),
      unresolvedCount,
      resolvedCount,
    };
  } catch {
    return empty;
  }
}

/** Full error detail with related signals for the detail page. */
export async function getErrorDetail(id: string): Promise<ErrorDetailBundle> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    throw new NotFoundError("Error not found");
  }

  const { data: row, error } = await supabase
    .from("errors")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!row) throw new NotFoundError("Error not found");

  const { data: projectMeta } = await supabase
    .from("projects")
    .select("name, framework")
    .eq("id", row.project_id)
    .maybeSingle();

  const sdkVersion =
    jsonString(row.network, ["sdkVersion", "sdk_version", "version"]) ??
    jsonString(row.browser, ["sdkVersion", "sdk_version"]) ??
    jsonString(row.device, ["sdkVersion", "sdk_version"]);

  const detail: ErrorDetail = {
    ...mapErrorRow({
      id: row.id,
      project_id: row.project_id,
      message: row.message,
      level: row.level,
      type: row.type,
      url: row.url,
      fingerprint: row.fingerprint,
      occurrences: row.occurrences,
      environment: row.environment,
      release: row.release,
      first_seen: row.first_seen,
      last_seen: row.last_seen,
      projects: projectMeta
        ? { name: projectMeta.name, framework: projectMeta.framework }
        : null,
    }),
    stack: row.stack,
    browser: row.browser,
    os: row.os,
    device: row.device,
    screen: row.screen,
    language: row.language,
    timezone: row.timezone,
    performance: row.performance,
    network: row.network,
    memory: row.memory,
    framework: projectMeta?.framework ?? null,
    sdkVersion,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  const windowMs = 6 * 60 * 60 * 1000;
  const center = new Date(row.last_seen).getTime();
  const fromIso = new Date(center - windowMs).toISOString();
  const toIso = new Date(center + windowMs).toISOString();

  const [sameFingerprint, sameType, relatedIncidentsRes, keysRes, aiRes] =
    await Promise.all([
      supabase
        .from("errors")
        .select("id, message, level, occurrences, last_seen, fingerprint")
        .eq("project_id", row.project_id)
        .eq("user_id", user.id)
        .eq("fingerprint", row.fingerprint)
        .neq("id", row.id)
        .order("last_seen", { ascending: false })
        .limit(8),
      row.type
        ? supabase
            .from("errors")
            .select("id, message, level, occurrences, last_seen, fingerprint")
            .eq("project_id", row.project_id)
            .eq("user_id", user.id)
            .eq("type", row.type)
            .neq("id", row.id)
            .order("last_seen", { ascending: false })
            .limit(8)
        : Promise.resolve({
            data: [] as {
              id: string;
              message: string;
              level: string;
              occurrences: number;
              last_seen: string;
              fingerprint: string;
            }[],
          }),
      supabase
        .from("incidents")
        .select("id, title, status, severity, started_at, resolved_at")
        .eq("project_id", row.project_id)
        .eq("user_id", user.id)
        .gte("started_at", fromIso)
        .lte("started_at", toIso)
        .order("started_at", { ascending: false })
        .limit(5),
      supabase
        .from("api_keys")
        .select("name, key_prefix, environment, status, last_used_at")
        .eq("project_id", row.project_id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("last_used_at", { ascending: false, nullsFirst: false })
        .limit(5),
      supabase
        .from("ai_conversations")
        .select("id, title, last_message_at, updated_at")
        .eq("user_id", user.id)
        .eq("project_id", row.project_id)
        .order("updated_at", { ascending: false })
        .limit(3),
    ]);

  const seen = new Set<string>();
  const relatedRows: {
    id: string;
    message: string;
    level: string;
    occurrences: number;
    last_seen: string;
    fingerprint: string;
  }[] = [];

  for (const e of [...(sameFingerprint.data ?? []), ...(sameType.data ?? [])]) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    relatedRows.push(e);
    if (relatedRows.length >= 8) break;
  }

  if (relatedRows.length === 0) {
    const { data: fallback } = await supabase
      .from("errors")
      .select("id, message, level, occurrences, last_seen, fingerprint")
      .eq("project_id", row.project_id)
      .eq("user_id", user.id)
      .neq("id", row.id)
      .order("last_seen", { ascending: false })
      .limit(5);
    relatedRows.push(...(fallback ?? []));
  }

  const relatedErrors: RelatedErrorSummary[] = relatedRows.map((e) => ({
    id: e.id,
    message: e.message,
    level: asLevel(e.level),
    occurrences: e.occurrences,
    lastSeenAt: e.last_seen,
    fingerprint: e.fingerprint,
  }));

  const relatedIncidents: RelatedIncidentSummary[] = (
    relatedIncidentsRes.data ?? []
  ).map((i) => ({
    id: i.id,
    title: i.title,
    status: i.status,
    severity: i.severity,
    startedAt: i.started_at,
    resolvedAt: i.resolved_at,
  }));

  const apiKeyHints = (keysRes.data ?? []).map((k) => {
    const used = k.last_used_at
      ? ` · last used ${new Date(k.last_used_at).toISOString().slice(0, 10)}`
      : "";
    return `${k.name} (${k.key_prefix}…) · ${k.environment}${used}`;
  });

  const timeline: ErrorTimelineEvent[] = [
    {
      id: "created",
      at: row.first_seen,
      title: "Error group created",
      detail: "First occurrence recorded",
      tone: "danger",
    },
    {
      id: "last",
      at: row.last_seen,
      title: `${row.occurrences} occurrence${row.occurrences === 1 ? "" : "s"}`,
      detail: "Most recent occurrence",
      tone: "warning",
    },
  ];

  for (const incident of relatedIncidents) {
    timeline.push({
      id: `inc-open-${incident.id}`,
      at: incident.startedAt,
      title: `Incident opened: ${incident.title}`,
      detail: `${incident.severity} · ${incident.status}`,
      tone: "danger",
    });
    if (incident.resolvedAt) {
      timeline.push({
        id: `inc-res-${incident.id}`,
        at: incident.resolvedAt,
        title: `Incident resolved: ${incident.title}`,
        tone: "success",
      });
    }
  }

  for (const conv of aiRes.data ?? []) {
    const at = conv.last_message_at ?? conv.updated_at;
    if (!at) continue;
    timeline.push({
      id: `ai-${conv.id}`,
      at,
      title: `AI analysis: ${conv.title}`,
      detail: "Assistant conversation on this project",
      tone: "primary",
    });
  }

  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    error: detail,
    relatedErrors,
    relatedIncidents,
    timeline,
    apiKeyHints,
  };
}

/** Export current filter set as CSV (capped). */
export async function exportErrorsCsv(
  params: ListErrorsParams = {},
): Promise<string> {
  const page = await listErrors({ ...params, page: 1, pageSize: 500 });
  const header = [
    "id",
    "message",
    "level",
    "type",
    "occurrences",
    "environment",
    "release",
    "project",
    "url",
    "fingerprint",
    "first_seen",
    "last_seen",
  ];
  const rows = page.items.map((e) =>
    [
      e.id,
      csvEscape(e.message),
      e.level,
      e.type ?? "",
      e.occurrences,
      e.environment,
      e.release ?? "",
      csvEscape(e.projectName),
      e.url ?? "",
      e.fingerprint,
      e.firstSeenAt,
      e.lastSeenAt,
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
