import { NextResponse } from "next/server";

import { fail, withErrorHandling } from "@/lib/api-response";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import {
  exportAuditCsv,
  exportAuditJson,
} from "@/services/admin/audit-center.service";
import type {
  AuditCategory,
  AuditFilters,
  AuditResult,
  AuditSeverity,
} from "@/services/admin/audit-center.types";
import { getAdminUserByAuthId } from "@/services/admin/admin-user.service";
import { hasAdminPermission } from "@/services/admin/permissions";
import { getAuthenticatedUser } from "@/services/auth";
import { createSupabaseServerClient } from "@/supabase/server";
import type { AdminAuditAction, AdminPlatformRole } from "@/types/database";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return fail(new UnauthorizedError());

  const admin = await getAdminUserByAuthId(supabase, user.id);
  if (!admin || !hasAdminPermission(admin.role, "admin:audit:read")) {
    return fail(new ForbiddenError("Admin audit access required."));
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";

  const filters: AuditFilters = {
    q: searchParams.get("q") || undefined,
    range:
      (["24h", "7d", "30d", "90d", "all"].find(
        (value) => value === searchParams.get("range"),
      ) as AuditFilters["range"]) ?? "30d",
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    severity:
      (["critical", "high", "medium", "low"].find(
        (value) => value === searchParams.get("severity"),
      ) as AuditSeverity | undefined) ?? "",
    category:
      (["security", "admin", "workspace", "user", "system"].find(
        (value) => value === searchParams.get("category"),
      ) as AuditCategory | undefined) ?? "",
    actorRole:
      (["SUPER_ADMIN", "ADMIN", "SUPPORT", "READ_ONLY"].find(
        (value) => value === searchParams.get("actorRole"),
      ) as AdminPlatformRole | undefined) ?? "",
    workspaceId: searchParams.get("workspaceId") || undefined,
    projectId: searchParams.get("projectId") || undefined,
    result:
      (["success", "failure", "unknown"].find(
        (value) => value === searchParams.get("result"),
      ) as AuditResult | undefined) ?? "",
    action: (searchParams.get("action") as AdminAuditAction | null) || "",
  };

  if (format === "json") {
    const json = await exportAuditJson(admin.role, filters);
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="zynteksis-audit.json"',
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = await exportAuditCsv(admin.role, filters);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="zynteksis-audit.csv"',
      "Cache-Control": "no-store",
    },
  });
});
