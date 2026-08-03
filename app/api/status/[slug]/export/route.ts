import { NextResponse } from "next/server";

import {
  exportStatusPageCsv,
  exportStatusPageJson,
  getPublicStatusPage,
} from "@/services/status";
import { createSupabaseAdminClient } from "@/supabase/admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const admin = createSupabaseAdminClient();
  const data = await getPublicStatusPage(admin, slug);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";

  if (format === "json") {
    return new NextResponse(exportStatusPageJson(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="status-${slug}.json"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(exportStatusPageCsv(data), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="status-${slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
