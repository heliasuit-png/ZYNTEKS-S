import { NextResponse } from "next/server";

import { withErrorHandling } from "@/lib/api-response";
import { NotFoundError, RateLimitError, ValidationError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import {
  exportStatusPageCsv,
  exportStatusPageJson,
  getPublicStatusPage,
} from "@/services/status";
import { createSupabaseAdminClient } from "@/supabase/admin";

/**
 * Public status-page export. Errors use the shared API envelope
 * `{ success: false, error: { code, message } }`. Successful downloads remain
 * raw CSV/JSON attachments (not JSON envelopes) so clients keep working.
 */
export const GET = withErrorHandling(
  async (
    request: Request,
    context: { params: Promise<{ slug: string }> },
  ) => {
    const { slug } = await context.params;
    const normalized = slug?.trim() ?? "";
    if (!normalized || normalized.length > 120) {
      throw new ValidationError("Invalid status page slug.");
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anon";
    const exportLimit = rateLimit(
      `export:status:${ip}:${normalized}`,
      30,
      60_000,
    );
    if (!exportLimit.allowed) {
      throw new RateLimitError(
        "Too many export requests. Please try again shortly.",
      );
    }

    const admin = createSupabaseAdminClient();
    const data = await getPublicStatusPage(admin, normalized);
    if (!data) {
      throw new NotFoundError("Status page not found");
    }

    const { searchParams } = new URL(request.url);
    const formatParam = searchParams.get("format");
    if (
      formatParam !== null &&
      formatParam !== "json" &&
      formatParam !== "csv"
    ) {
      throw new ValidationError("Invalid export format. Use csv or json.");
    }
    const format = formatParam === "json" ? "json" : "csv";

    if (format === "json") {
      return new NextResponse(exportStatusPageJson(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="status-${normalized}.json"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return new NextResponse(exportStatusPageCsv(data), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="status-${normalized}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  },
);
