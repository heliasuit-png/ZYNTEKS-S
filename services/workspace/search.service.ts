import "server-only";

import type { TypedSupabaseClient } from "@/supabase/client";
import { DASHBOARD_ROUTES } from "@/lib/constants";

export interface SearchHit {
  id: string;
  label: string;
  href: string;
  group:
    | "Members"
    | "Workspaces"
    | "Projects"
    | "Errors"
    | "Incidents"
    | "Notifications"
    | "API Keys"
    | "AI Chats";
  keywords?: string;
}

/**
 * Global enterprise search across workspace-scoped resources.
 * Kept lightweight for command-palette latency.
 */
export async function searchWorkspace(
  supabase: TypedSupabaseClient,
  userId: string,
  workspaceId: string,
  query: string,
): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const like = `%${q}%`;
  const qLower = q.toLowerCase();
  const hits: SearchHit[] = [];

  const { data: projectRows } = await supabase
    .from("projects")
    .select("id, name")
    .eq("workspace_id", workspaceId);
  const projects = projectRows ?? [];
  const projectIds = projects.map((p) => p.id);

  const [workspaces, members, apiKeys, errors, incidents, notifications, chats] =
    await Promise.all([
      supabase
        .from("workspaces")
        .select("id, name, slug")
        .ilike("name", like)
        .limit(5),
      supabase
        .from("workspace_members")
        .select("id, user_id, role")
        .eq("workspace_id", workspaceId)
        .limit(50),
      projectIds.length > 0
        ? supabase
            .from("api_keys")
            .select("id, name")
            .in("project_id", projectIds)
            .ilike("name", like)
            .limit(8)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      projectIds.length > 0
        ? supabase
            .from("errors")
            .select("id, message")
            .in("project_id", projectIds)
            .ilike("message", like)
            .limit(8)
        : Promise.resolve({ data: [] as { id: string; message: string }[] }),
      projectIds.length > 0
        ? supabase
            .from("incidents")
            .select("id, title")
            .in("project_id", projectIds)
            .ilike("title", like)
            .limit(8)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      supabase
        .from("notification_logs")
        .select("id, title, body")
        .eq("user_id", userId)
        .eq("channel", "dashboard")
        .or(`title.ilike.${like},body.ilike.${like}`)
        .limit(8),
      supabase
        .from("ai_conversations")
        .select("id, title")
        .eq("user_id", userId)
        .ilike("title", like)
        .limit(8),
    ]);

  for (const w of workspaces.data ?? []) {
    hits.push({
      id: `ws-${w.id}`,
      label: w.name,
      href: DASHBOARD_ROUTES.organization,
      group: "Workspaces",
      keywords: w.slug,
    });
  }

  const memberRows = members.data ?? [];
  if (memberRows.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in(
        "id",
        memberRows.map((m) => m.user_id),
      );
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    for (const m of memberRows) {
      const p = profileMap.get(m.user_id);
      const name = p?.full_name || p?.email || "Member";
      const email = p?.email ?? "";
      if (
        name.toLowerCase().includes(qLower) ||
        email.toLowerCase().includes(qLower)
      ) {
        hits.push({
          id: `member-${m.id}`,
          label: name,
          href: DASHBOARD_ROUTES.members,
          group: "Members",
          keywords: `${email} ${m.role}`,
        });
      }
    }
  }

  for (const p of projects) {
    if (p.name.toLowerCase().includes(qLower)) {
      hits.push({
        id: `project-${p.id}`,
        label: p.name,
        href: DASHBOARD_ROUTES.projects,
        group: "Projects",
      });
    }
  }
  for (const k of apiKeys.data ?? []) {
    hits.push({
      id: `key-${k.id}`,
      label: k.name,
      href: DASHBOARD_ROUTES.apiKeys,
      group: "API Keys",
    });
  }
  for (const e of errors.data ?? []) {
    hits.push({
      id: `error-${e.id}`,
      label: e.message,
      href: `${DASHBOARD_ROUTES.errors}/${e.id}`,
      group: "Errors",
    });
  }
  for (const i of incidents.data ?? []) {
    hits.push({
      id: `incident-${i.id}`,
      label: i.title,
      href: `${DASHBOARD_ROUTES.incidents}/${i.id}`,
      group: "Incidents",
    });
  }
  for (const n of notifications.data ?? []) {
    hits.push({
      id: `notif-${n.id}`,
      label: n.title,
      href: DASHBOARD_ROUTES.notifications,
      group: "Notifications",
    });
  }
  for (const c of chats.data ?? []) {
    hits.push({
      id: `ai-${c.id}`,
      label: c.title,
      href: `${DASHBOARD_ROUTES.aiAssistant}?c=${c.id}`,
      group: "AI Chats",
    });
  }

  return hits.slice(0, 40);
}
