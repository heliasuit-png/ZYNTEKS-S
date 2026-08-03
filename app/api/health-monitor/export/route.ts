import { NextResponse } from "next/server";

import { fail, withErrorHandling } from "@/lib/api-response";
import { API_KEY_ENVIRONMENTS } from "@/lib/constants";
import { UnauthorizedError } from "@/lib/errors";
import { getAuthenticatedUser } from "@/services/auth";
import {
  exportHealthCsv,
  exportHealthJson,
} from "@/services/dashboard/health.service";
import { createSupabaseServerClient } from "@/supabase/server";
import type { HealthStatus } from "@/features/health/types";

const STATUSES: HealthStatus[] = [
  "healthy",
  "warning",
  "critical",
  "recovered",
  "investigating",
];

export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return fail(new UnauthorizedError());
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";
  const environment = API_KEY_ENVIRONMENTS.find(
    (value) => value === searchParams.get("environment"),
  );
  const status = STATUSES.find((value) => value === searchParams.get("status"));
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  const params = {
    search: searchParams.get("q")?.trim() || undefined,
    projectId: searchParams.get("projectId") || undefined,
    environment,
    status,
    from: fromRaw
      ? new Date(`${fromRaw}T00:00:00.000Z`).toISOString()
      : undefined,
    to: toRaw ? new Date(`${toRaw}T23:59:59.999Z`).toISOString() : undefined,
  };

  if (format === "json") {
    const json = await exportHealthJson(params);
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="zynteksis-health.json"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = await exportHealthCsv(params);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zynteksis-health.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
