import type { NextRequest } from "next/server";

import { SDK_INGEST } from "@/lib/constants";
import {
  authenticateSdkRequest,
  readSdkBody,
  sdkFailure,
  sdkPreflight,
  sdkSuccess,
} from "@/monitoring/http";
import { ingestHeartbeat } from "@/monitoring/ingest.service";
import { heartbeatPayloadSchema } from "@/monitoring/schemas";

export const runtime = "nodejs";

export function OPTIONS() {
  return sdkPreflight();
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await authenticateSdkRequest(request);
    const payload = await readSdkBody(
      request,
      heartbeatPayloadSchema,
      SDK_INGEST.maxPayloadBytes.heartbeat,
    );
    await ingestHeartbeat(ctx.admin, ctx, payload);
    return sdkSuccess();
  } catch (error) {
    return sdkFailure(error);
  }
}
