import { NextResponse } from "next/server";

import { fail, withErrorHandling } from "@/lib/api-response";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { getAdminUserByAuthId } from "@/services/admin/admin-user.service";
import {
  exportAiOpsCsv,
  exportAiOpsJson,
} from "@/services/admin/ai-operations.service";
import type { AiOpsFilters } from "@/services/admin/ai-operations.types";
import { hasAdminPermission } from "@/services/admin/permissions";
import { getAuthenticatedUser } from "@/services/auth";
import { createSupabaseServerClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return fail(new UnauthorizedError());

  const admin = await getAdminUserByAuthId(supabase, user.id);
  if (!admin || !hasAdminPermission(admin.role, "admin:ai:read")) {
    return fail(new ForbiddenError("Admin AI access required."));
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";

  const filters: AiOpsFilters = {
    range:
      (["24h", "7d", "30d", "90d"].find(
        (value) => value === searchParams.get("range"),
      ) as AiOpsFilters["range"]) ?? "30d",
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    workspaceId: searchParams.get("workspaceId") || undefined,
    projectId: searchParams.get("projectId") || undefined,
    model: searchParams.get("model") || undefined,
    environment: searchParams.get("environment") || undefined,
  };

  if (format === "json") {
    const json = await exportAiOpsJson(admin.role, filters);
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="zynteksis-ai-ops.json"',
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = await exportAiOpsCsv(admin.role, filters);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="zynteksis-ai-ops.csv"',
      "Cache-Control": "no-store",
    },
  });
});
