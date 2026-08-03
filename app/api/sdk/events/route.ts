import type { NextRequest } from "next/server";

import { SDK_INGEST } from "@/lib/constants";
import {
  authenticateSdkRequest,
  readSdkBody,
  sdkFailure,
  sdkPreflight,
  sdkSuccess,
} from "@/monitoring/http";
import { ingestEvents } from "@/monitoring/ingest.service";
import { eventsPayloadSchema } from "@/monitoring/schemas";

export const runtime = "nodejs";

export function OPTIONS() {
  return sdkPreflight();
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await authenticateSdkRequest(request);
    const payload = await readSdkBody(
      request,
      eventsPayloadSchema,
      SDK_INGEST.maxPayloadBytes.events,
    );
    await ingestEvents(ctx.admin, ctx, payload);
    return sdkSuccess({ accepted: payload.events.length });
  } catch (error) {
    return sdkFailure(error);
  }
}
