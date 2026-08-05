import { NextResponse } from "next/server";

import { fail, withErrorHandling } from "@/lib/api-response";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import {
  exportAnalyticsCsv,
  exportAnalyticsJson,
} from "@/services/admin/analytics-intelligence.service";
import type { AnalyticsFilters } from "@/services/admin/analytics-intelligence.types";
import { getAdminUserByAuthId } from "@/services/admin/admin-user.service";
import { hasAdminPermission } from "@/services/admin/permissions";
import { getAuthenticatedUser } from "@/services/auth";
import { createSupabaseServerClient } from "@/supabase/server";
import type { ApiKeyEnvironment } from "@/types/database";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return fail(new UnauthorizedError());

  const admin = await getAdminUserByAuthId(supabase, user.id);
  if (!admin || !hasAdminPermission(admin.role, "admin:analytics:read")) {
    return fail(new ForbiddenError("Admin analytics access required."));
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";
  const environment = ["production", "staging", "development"].find(
    (value) => value === searchParams.get("environment"),
  ) as ApiKeyEnvironment | undefined;

  const filters: AnalyticsFilters = {
    range:
      (["24h", "7d", "30d", "90d"].find(
        (value) => value === searchParams.get("range"),
      ) as AnalyticsFilters["range"]) ?? "30d",
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    workspaceId: searchParams.get("workspaceId") || undefined,
    projectId: searchParams.get("projectId") || undefined,
    country: searchParams.get("country") || undefined,
    environment: environment ?? "",
  };

  if (format === "json") {
    const json = await exportAnalyticsJson(admin.role, filters);
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="zynteksis-analytics.json"',
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = await exportAnalyticsCsv(admin.role, filters);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="zynteksis-analytics.csv"',
      "Cache-Control": "no-store",
    },
  });
});
