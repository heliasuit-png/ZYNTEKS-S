import { NextResponse } from "next/server";

import { fail, withErrorHandling } from "@/lib/api-response";
import { API_KEY_ENVIRONMENTS } from "@/lib/constants";
import { UnauthorizedError } from "@/lib/errors";
import { getAuthenticatedUser } from "@/services/auth";
import { exportErrorsCsv } from "@/services/dashboard/errors.service";
import { createSupabaseServerClient } from "@/supabase/server";
import type { EventLevel } from "@/types/database";

const LEVELS: EventLevel[] = ["debug", "info", "warning", "error", "fatal"];

export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return fail(new UnauthorizedError());
  }

  const { searchParams } = new URL(request.url);
  const environment = API_KEY_ENVIRONMENTS.find(
    (value) => value === searchParams.get("environment"),
  );
  const level = LEVELS.find((value) => value === searchParams.get("level"));
  const activityParam = searchParams.get("activity");
  const activity =
    activityParam === "unresolved" || activityParam === "resolved"
      ? activityParam
      : undefined;

  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  const csv = await exportErrorsCsv({
    search: searchParams.get("q")?.trim() || undefined,
    projectId: searchParams.get("projectId") || undefined,
    environment,
    level,
    release: searchParams.get("release")?.trim() || undefined,
    activity,
    from: fromRaw
      ? new Date(`${fromRaw}T00:00:00.000Z`).toISOString()
      : undefined,
    to: toRaw ? new Date(`${toRaw}T23:59:59.999Z`).toISOString() : undefined,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zynteksis-errors.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
