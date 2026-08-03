import { NextResponse } from "next/server";

import { fail, withErrorHandling } from "@/lib/api-response";
import {
  API_KEY_ENVIRONMENTS,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
} from "@/lib/constants";
import { UnauthorizedError } from "@/lib/errors";
import { getAuthenticatedUser } from "@/services/auth";
import {
  exportIncidentsCsv,
  exportIncidentsJson,
} from "@/services/dashboard/incidents.service";
import { createSupabaseServerClient } from "@/supabase/server";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";

const SORTS = ["started_at", "severity", "status", "resolved_at"] as const;

export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return fail(new UnauthorizedError());
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";
  const status = INCIDENT_STATUSES.find(
    (v) => v === searchParams.get("status"),
  ) as IncidentStatus | undefined;
  const severity = INCIDENT_SEVERITIES.find(
    (v) => v === searchParams.get("severity"),
  ) as IncidentSeverity | undefined;
  const environment = API_KEY_ENVIRONMENTS.find(
    (v) => v === searchParams.get("environment"),
  );
  const sort =
    SORTS.find((v) => v === searchParams.get("sort")) ?? "started_at";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  const params = {
    search: searchParams.get("q")?.trim() || undefined,
    projectId: searchParams.get("projectId") || undefined,
    environment,
    status,
    severity,
    sort,
    sortDir: sortDir as "asc" | "desc",
    from: fromRaw
      ? new Date(`${fromRaw}T00:00:00.000Z`).toISOString()
      : undefined,
    to: toRaw ? new Date(`${toRaw}T23:59:59.999Z`).toISOString() : undefined,
  };

  if (format === "json") {
    const json = await exportIncidentsJson(params);
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="zynteksis-incidents.json"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = await exportIncidentsCsv(params);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zynteksis-incidents.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
