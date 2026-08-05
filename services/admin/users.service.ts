import "server-only";

import { NotFoundError } from "@/lib/errors";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { assertAdminPermission } from "@/services/admin/permissions";
import { listAdminAuditForTarget } from "@/services/admin/admin-audit.service";
import type { AdminPlatformRole } from "@/services/admin/types";
import type {
  AdminUserDetail,
  AdminUserListItem,
  UsersListFilters,
  UsersListResult,
  UsersOverviewStats,
  UsersSortField,
} from "@/services/admin/users.types";
import { createSupabaseAdminClient } from "@/supabase/admin";
import type { SubscriptionPlan, UserStatus } from "@/types/database";

function startOfUtcDayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function countVerifiedUsers(): Promise<number> {
  const admin = createSupabaseAdminClient();
  let page = 1;
  let verified = 0;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const users = data.users ?? [];
    verified += users.filter((user) => Boolean(user.email_confirmed_at)).length;
    if (users.length < 200) break;
    page += 1;
    if (page > 50) break;
  }
  return verified;
}

async function loadOverview(): Promise<UsersOverviewStats> {
  const admin = createSupabaseAdminClient();
  const today = startOfUtcDayIso();

  const [
    totalUsers,
    newToday,
    activeRows,
    suspendedUsers,
    admins,
    owners,
    verifiedUsers,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today),
    admin
      .from("user_sessions")
      .select("user_id")
      .gte("last_active_at", today)
      .is("revoked_at", null)
      .limit(20000),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "banned"),
    admin.from("admin_users").select("id", { count: "exact", head: true }),
    admin.from("workspaces").select("owner_id"),
    countVerifiedUsers(),
  ]);

  for (const result of [totalUsers, newToday, suspendedUsers, admins]) {
    if (result.error) throw mapPostgrestError(result.error);
  }
  if (activeRows.error) throw mapPostgrestError(activeRows.error);
  if (owners.error) throw mapPostgrestError(owners.error);

  const activeToday = new Set(
    (activeRows.data ?? []).map((row) => row.user_id),
  ).size;
  const workspaceOwners = new Set(
    (owners.data ?? []).map((row) => row.owner_id),
  ).size;

  return {
    totalUsers: totalUsers.count ?? 0,
    newToday: newToday.count ?? 0,
    activeToday,
    verifiedUsers,
    suspendedUsers: suspendedUsers.count ?? 0,
    admins: admins.count ?? 0,
    workspaceOwners,
  };
}

async function enrichAuthUsers(userIds: string[]): Promise<
  Map<
    string,
    {
      verified: boolean;
      providers: string[];
    }
  >
> {
  const admin = createSupabaseAdminClient();
  const map = new Map<
    string,
    {
      verified: boolean;
      providers: string[];
    }
  >();
  await Promise.all(
    userIds.map(async (id) => {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (error || !data.user) {
        map.set(id, { verified: false, providers: ["email"] });
        return;
      }
      const providers = [
        ...new Set(
          (data.user.identities ?? [])
            .map((identity) => identity.provider)
            .filter((provider): provider is string => Boolean(provider)),
        ),
      ];
      map.set(id, {
        verified: Boolean(data.user.email_confirmed_at),
        providers: providers.length > 0 ? providers : ["email"],
      });
    }),
  );
  return map;
}

function displayRole(
  platformRole: AdminPlatformRole | null,
  productRole: string,
): string {
  if (platformRole) return platformRole.replaceAll("_", " ");
  return productRole === "admin" ? "Product Admin" : "User";
}

export async function getUsersOverview(
  role: AdminPlatformRole,
): Promise<UsersOverviewStats> {
  assertAdminPermission(role, "admin:users:read");
  return loadOverview();
}

export async function listAdminUsers(
  role: AdminPlatformRole,
  filters: UsersListFilters = {},
): Promise<UsersListResult> {
  assertAdminPermission(role, "admin:users:read");
  const admin = createSupabaseAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let countryUserIds: string[] | null = null;
  if (filters.country?.trim()) {
    const { data, error } = await admin
      .from("user_sessions")
      .select("user_id")
      .ilike("country", filters.country.trim())
      .limit(5000);
    if (error) throw mapPostgrestError(error);
    countryUserIds = [...new Set((data ?? []).map((row) => row.user_id))];
    if (countryUserIds.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        overview: await loadOverview(),
      };
    }
  }

  let platformAdminIds: string[] | null = null;
  if (filters.role === "platform_admin") {
    const { data, error } = await admin.from("admin_users").select("user_id");
    if (error) throw mapPostgrestError(error);
    platformAdminIds = (data ?? []).map((row) => row.user_id);
    if (platformAdminIds.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        overview: await loadOverview(),
      };
    }
  }

  let query = admin.from("profiles").select(
    "id, email, full_name, avatar_url, role, status, subscription_plan, created_at, language, timezone, last_login_at, mfa_enabled",
    { count: "exact" },
  );

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
  }
  if (filters.plan) {
    query = query.eq("subscription_plan", filters.plan as SubscriptionPlan);
  }
  if (filters.status) {
    query = query.eq("status", filters.status as UserStatus);
  }
  if (filters.role === "product_admin") {
    query = query.eq("role", "admin");
  }
  if (filters.role === "user") {
    query = query.eq("role", "user");
  }
  if (platformAdminIds) {
    query = query.in("id", platformAdminIds);
  }
  if (countryUserIds) {
    query = query.in("id", countryUserIds);
  }
  if (filters.createdFrom) {
    query = query.gte("created_at", filters.createdFrom);
  }
  if (filters.createdTo) {
    query = query.lte("created_at", filters.createdTo);
  }

  const sort = filters.sort ?? "created_at";
  const ascending = (filters.direction ?? "desc") === "asc";
  const profileSortColumns: Partial<
    Record<UsersSortField, "full_name" | "email" | "status" | "created_at" | "role" | "subscription_plan">
  > = {
    full_name: "full_name",
    email: "email",
    status: "status",
    created_at: "created_at",
    role: "role",
    plan: "subscription_plan",
  };
  const profileSort = profileSortColumns[sort];
  if (profileSort) {
    query = query.order(profileSort, { ascending, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: profiles, error, count } = await query.range(from, to);
  if (error) throw mapPostgrestError(error);

  const ids = (profiles ?? []).map((row) => row.id);
  if (ids.length === 0) {
    return {
      items: [],
      total: count ?? 0,
      page,
      pageSize,
      overview: await loadOverview(),
    };
  }

  const [
    adminRows,
    workspaceRows,
    projectRows,
    sessionRows,
    authMeta,
  ] = await Promise.all([
    admin.from("admin_users").select("user_id, role").in("user_id", ids),
    admin
      .from("workspaces")
      .select("id, name, owner_id, created_at")
      .in("owner_id", ids)
      .order("created_at", { ascending: true }),
    admin.from("projects").select("id, user_id").in("user_id", ids),
    admin
      .from("user_sessions")
      .select("user_id, country, last_active_at, revoked_at")
      .in("user_id", ids)
      .order("last_active_at", { ascending: false })
      .limit(5000),
    enrichAuthUsers(ids),
  ]);

  for (const result of [adminRows, workspaceRows, projectRows, sessionRows]) {
    if (result.error) throw mapPostgrestError(result.error);
  }

  const platformByUser = new Map(
    (adminRows.data ?? []).map((row) => [row.user_id, row.role]),
  );
  const workspaceByOwner = new Map<string, { id: string; name: string }>();
  for (const row of workspaceRows.data ?? []) {
    if (!workspaceByOwner.has(row.owner_id)) {
      workspaceByOwner.set(row.owner_id, { id: row.id, name: row.name });
    }
  }
  const projectCount = new Map<string, number>();
  for (const row of projectRows.data ?? []) {
    projectCount.set(row.user_id, (projectCount.get(row.user_id) ?? 0) + 1);
  }
  const lastLogin = new Map<string, string>();
  const countryByUser = new Map<string, string>();
  for (const row of sessionRows.data ?? []) {
    if (!lastLogin.has(row.user_id) && !row.revoked_at) {
      lastLogin.set(row.user_id, row.last_active_at);
    } else if (!lastLogin.has(row.user_id)) {
      lastLogin.set(row.user_id, row.last_active_at);
    }
    if (row.country && !countryByUser.has(row.user_id)) {
      countryByUser.set(row.user_id, row.country);
    }
  }

  let items: AdminUserListItem[] = (profiles ?? []).map((row) => {
    const platformRole = platformByUser.get(row.id) ?? null;
    const workspace = workspaceByOwner.get(row.id) ?? null;
    const auth = authMeta.get(row.id);
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      productRole: row.role,
      platformRole,
      displayRole: displayRole(platformRole, row.role),
      workspaceName: workspace?.name ?? null,
      workspaceId: workspace?.id ?? null,
      projectCount: projectCount.get(row.id) ?? 0,
      plan: row.subscription_plan,
      status: row.status,
      verified: auth?.verified ?? null,
      country: countryByUser.get(row.id) ?? null,
      lastLoginAt: row.last_login_at ?? lastLogin.get(row.id) ?? null,
      createdAt: row.created_at,
      authProviders: auth?.providers ?? ["email"],
      mfaEnabled: row.mfa_enabled ?? false,
    };
  });

  if (filters.verified === "yes") {
    items = items.filter((item) => item.verified === true);
  } else if (filters.verified === "no") {
    items = items.filter((item) => item.verified === false);
  }

  if (filters.lastLoginFrom) {
    const fromTs = new Date(filters.lastLoginFrom).getTime();
    items = items.filter(
      (item) =>
        item.lastLoginAt && new Date(item.lastLoginAt).getTime() >= fromTs,
    );
  }
  if (filters.lastLoginTo) {
    const toTs = new Date(filters.lastLoginTo).getTime();
    items = items.filter(
      (item) =>
        item.lastLoginAt && new Date(item.lastLoginAt).getTime() <= toTs,
    );
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    items = items.filter(
      (item) =>
        item.email.toLowerCase().includes(q) ||
        (item.fullName ?? "").toLowerCase().includes(q) ||
        (item.workspaceName ?? "").toLowerCase().includes(q),
    );
  }

  const inMemorySort = ["role", "plan", "last_login", "projects"] as const;
  if (inMemorySort.includes(sort as (typeof inMemorySort)[number])) {
    items = [...items].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sort === "role") {
        av = a.displayRole;
        bv = b.displayRole;
      } else if (sort === "plan") {
        av = a.plan;
        bv = b.plan;
      } else if (sort === "last_login") {
        av = a.lastLoginAt ?? "";
        bv = b.lastLoginAt ?? "";
      } else if (sort === "projects") {
        av = a.projectCount;
        bv = b.projectCount;
      }
      if (av < bv) return ascending ? -1 : 1;
      if (av > bv) return ascending ? 1 : -1;
      return 0;
    });
  }

  return {
    items,
    total: count ?? items.length,
    page,
    pageSize,
    overview: await loadOverview(),
  };
}

export async function getAdminUserDetail(
  role: AdminPlatformRole,
  userId: string,
): Promise<AdminUserDetail> {
  assertAdminPermission(role, "admin:users:read");
  const admin = createSupabaseAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw mapPostgrestError(error);
  if (!profile) {
    throw new NotFoundError("User not found");
  }

  const list = await listAdminUsers(role, { q: profile.email, pageSize: 1 });
  const listItem =
    list.items.find((item) => item.id === userId) ??
    ({
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      productRole: profile.role,
      platformRole: null,
      displayRole: displayRole(null, profile.role),
      workspaceName: null,
      workspaceId: null,
      projectCount: 0,
      plan: profile.subscription_plan,
      status: profile.status,
      verified: null,
      country: null,
      lastLoginAt: profile.last_login_at,
      createdAt: profile.created_at,
      authProviders: ["email"],
      mfaEnabled: profile.mfa_enabled ?? false,
    } satisfies AdminUserListItem);

  const dayAgo = hoursAgoIso(24);
  const [
    projects,
    apiKeys,
    aiUsage,
    errors,
    incidents,
    sessions,
    workspaces,
    authUser,
    failures,
    loginEvents,
    audit,
  ] = await Promise.all([
    admin
      .from("projects")
      .select("id, name, slug, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("api_keys")
      .select("id, name, key_prefix, status, environment, last_used_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("ai_usage")
      .select("total_tokens")
      .eq("user_id", userId)
      .limit(5000),
    admin
      .from("errors")
      .select("id, message, level, last_seen")
      .eq("user_id", userId)
      .order("last_seen", { ascending: false })
      .limit(10),
    admin
      .from("incidents")
      .select("id, title, status, severity, detected_at")
      .eq("user_id", userId)
      .order("detected_at", { ascending: false })
      .limit(10),
    admin
      .from("user_sessions")
      .select(
        "id, device_label, browser, os, country, ip_address, last_active_at, is_current, revoked_at",
      )
      .eq("user_id", userId)
      .order("last_active_at", { ascending: false })
      .limit(30),
    admin
      .from("workspaces")
      .select("id, name, slug")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true }),
    admin.auth.admin.getUserById(userId),
    admin
      .from("api_key_logs")
      .select("id, ip_address, created_at")
      .eq("user_id", userId)
      .eq("event", "auth_failed")
      .gte("created_at", dayAgo)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("auth_login_events")
      .select(
        "id, method, result, provider, device_label, ip_address, country, is_suspicious, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
    listAdminAuditForTarget(userId, 40),
  ]);

  for (const result of [
    projects,
    apiKeys,
    aiUsage,
    errors,
    incidents,
    sessions,
    workspaces,
    failures,
    loginEvents,
  ]) {
    if ("error" in result && result.error) {
      throw mapPostgrestError(result.error);
    }
  }

  const tokens = (aiUsage.data ?? []).reduce(
    (sum, row) => sum + (row.total_tokens ?? 0),
    0,
  );
  const activeSessions = (sessions.data ?? []).filter(
    (row) => !row.revoked_at,
  ).length;

  const verified = Boolean(authUser.data.user?.email_confirmed_at);
  const authProviders = [
    ...new Set(
      (authUser.data.user?.identities ?? [])
        .map((identity) => identity.provider)
        .filter((provider): provider is string => Boolean(provider)),
    ),
  ];
  const failedLogins24h = (loginEvents.data ?? []).filter(
    (row) => row.result === "failure" && row.created_at >= dayAgo,
  ).length;
  const suspiciousCount = (loginEvents.data ?? []).filter(
    (row) => row.is_suspicious,
  ).length;
  const enrichedProfile: AdminUserListItem = {
    ...listItem,
    verified,
    country:
      listItem.country ??
      sessions.data?.find((row) => row.country)?.country ??
      null,
    lastLoginAt:
      profile.last_login_at ??
      listItem.lastLoginAt ??
      sessions.data?.[0]?.last_active_at ??
      null,
    authProviders: authProviders.length > 0 ? authProviders : ["email"],
    mfaEnabled: profile.mfa_enabled ?? false,
  };

  const activity = [
    ...audit.map((row) => ({
      id: row.id,
      title: row.action.replaceAll("_", " "),
      detail: row.summary,
      occurredAt: row.createdAt,
    })),
    ...(errors.data ?? []).map((row) => ({
      id: `err-${row.id}`,
      title: "Error",
      detail: row.message,
      occurredAt: row.last_seen,
    })),
    ...(incidents.data ?? []).map((row) => ({
      id: `inc-${row.id}`,
      title: "Incident",
      detail: row.title,
      occurredAt: row.detected_at,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, 40);

  return {
    profile: enrichedProfile,
    phone: null,
    timezone: profile.timezone,
    language: profile.language,
    subscriptionPlan: profile.subscription_plan,
    projects: (projects.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
    })),
    apiKeys: (apiKeys.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      keyPrefix: row.key_prefix,
      status: row.status,
      environment: row.environment,
      lastUsedAt: row.last_used_at,
    })),
    aiUsage: {
      requests: aiUsage.data?.length ?? 0,
      tokens,
    },
    recentErrors: (errors.data ?? []).map((row) => ({
      id: row.id,
      message: row.message,
      level: row.level,
      lastSeen: row.last_seen,
    })),
    recentIncidents: (incidents.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      severity: row.severity,
      detectedAt: row.detected_at,
    })),
    sessions: (sessions.data ?? []).map((row) => ({
      id: row.id,
      deviceLabel: row.device_label,
      browser: row.browser,
      os: row.os,
      country: row.country,
      ipAddress: row.ip_address,
      lastActiveAt: row.last_active_at,
      isCurrent: row.is_current,
      revokedAt: row.revoked_at,
    })),
    ownedWorkspaces: (workspaces.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
    })),
    activity,
    loginHistory: (loginEvents.data ?? []).map((row) => ({
      id: row.id,
      method: row.method,
      result: row.result,
      provider: row.provider,
      deviceLabel: row.device_label,
      ipAddress: row.ip_address,
      country: row.country,
      isSuspicious: row.is_suspicious,
      createdAt: row.created_at,
    })),
    security: {
      failedApiKeyAuth24h: failures.data?.length ?? 0,
      failedLogins24h,
      activeSessions,
      blockedNote:
        "Application rate limits throttle auth attempts; persistent blocks are not stored.",
      suspiciousNote:
        suspiciousCount > 0
          ? `${suspiciousCount} suspicious login event(s) recorded for this user.`
          : "No suspicious login events recorded for this user.",
      newestFailures: [
        ...(loginEvents.data ?? [])
          .filter((row) => row.result === "failure")
          .slice(0, 10)
          .map((row) => ({
            id: row.id,
            detail: `Login ${row.method}${row.ip_address ? ` · IP ${row.ip_address}` : ""}`,
            occurredAt: row.created_at,
          })),
        ...(failures.data ?? []).map((row) => ({
          id: row.id,
          detail: row.ip_address
            ? `API key failure · IP ${row.ip_address}`
            : "API key failure · IP unknown",
          occurredAt: row.created_at,
        })),
      ].slice(0, 20),
    },
  };
}
