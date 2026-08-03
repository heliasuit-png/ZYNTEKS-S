import type { NextRequest } from "next/server";

import { SDK_INGEST } from "@/lib/constants";
import {
  authenticateSdkRequest,
  readSdkBody,
  sdkFailure,
  sdkPreflight,
  sdkSuccess,
} from "@/monitoring/http";
import { ingestError } from "@/monitoring/ingest.service";
import { errorPayloadSchema } from "@/monitoring/schemas";

export const runtime = "nodejs";

export function OPTIONS() {
  return sdkPreflight();
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await authenticateSdkRequest(request);
    const payload = await readSdkBody(
      request,
      errorPayloadSchema,
      SDK_INGEST.maxPayloadBytes.error,
    );
    const result = await ingestError(ctx.admin, ctx, payload);
    return sdkSuccess({ accepted: true, deduped: result.deduped });
  } catch (error) {
    return sdkFailure(error);
  }
}
