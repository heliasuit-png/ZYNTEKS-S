import type { NextRequest } from "next/server";

import { SDK_INGEST } from "@/lib/constants";
import {
  authenticateSdkRequest,
  readSdkBody,
  sdkFailure,
  sdkPreflight,
  sdkSuccess,
} from "@/monitoring/http";
import { ingestPerformance } from "@/monitoring/ingest.service";
import { performancePayloadSchema } from "@/monitoring/schemas";

export const runtime = "nodejs";

export function OPTIONS() {
  return sdkPreflight();
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await authenticateSdkRequest(request);
    const payload = await readSdkBody(
      request,
      performancePayloadSchema,
      SDK_INGEST.maxPayloadBytes.performance,
    );
    await ingestPerformance(ctx.admin, ctx, payload);
    return sdkSuccess();
  } catch (error) {
    return sdkFailure(error);
  }
}
