import "server-only";

/**
 * SDK ingest HTTP boundary.
 *
 * Authenticates project API keys, enforces size/rate limits, optionally gunzips
 * bodies, validates with Zod schemas, and returns CORS-aware JSON responses.
 * Route handlers under `app/api/sdk/*` should stay thin and delegate here.
 * See docs/API.md and docs/Monitoring.md.
 */

import { gunzipSync } from "node:zlib";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { z } from "zod";

import { API_KEY_PREFIX, SDK_INGEST } from "@/lib/constants";
import {
  PayloadTooLargeError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
  toAppError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateApiKey } from "@/services/api-keys";
import { createSupabaseAdminClient } from "@/supabase/admin";
import type { TypedSupabaseClient } from "@/supabase/types";
import type { ApiKeyEnvironment } from "@/types/database";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Content-Encoding, Authorization, X-Zynteksis-Key",
  "Access-Control-Max-Age": "86400",
};

/** Handles the CORS preflight request for SDK endpoints. */
export function sdkPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function jsonResponse(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

/** Standard accepted response for ingestion (202 Accepted). */
export function sdkSuccess(
  data: Record<string, unknown> = { accepted: true },
): NextResponse {
  return jsonResponse({ success: true, data }, 202);
}

/**
 * Serializes an error into a CORS-enabled response, hiding internal details
 * for non-operational failures.
 */
export function sdkFailure(error: unknown): NextResponse {
  const appError = toAppError(error);
  if (!appError.isOperational) {
    logger.error("SDK ingest failure", appError, { code: appError.code });
  }
  const message = appError.isOperational
    ? appError.message
    : "An unexpected error occurred";
  return jsonResponse(
    { success: false, error: { code: appError.code, message } },
    appError.statusCode,
  );
}

function extractApiKey(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }
  const custom = request.headers.get("x-zynteksis-key");
  return custom ? custom.trim() : null;
}

export interface SdkContext {
  admin: TypedSupabaseClient;
  projectId: string;
  userId: string;
  environment: ApiKeyEnvironment;
  ip: string | null;
}

/**
 * Authenticates an SDK request using the SHA-256 API key authentication
 * service and applies a per-project rate limit. Throws on failure.
 */
export async function authenticateSdkRequest(
  request: NextRequest,
): Promise<SdkContext> {
  const key = extractApiKey(request);
  if (!key || !key.startsWith(API_KEY_PREFIX)) {
    throw new UnauthorizedError("Missing or malformed API key.");
  }

  // The service-role client is required: SDK requests are not authenticated as
  // a Supabase user, so Row Level Security cannot be used for the lookup.
  const admin = createSupabaseAdminClient();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent");

  const auth = await authenticateApiKey(admin, key, {
    ipAddress: ip,
    userAgent,
  });
  if (!auth) {
    throw new UnauthorizedError("Invalid API key.");
  }

  const limit = rateLimit(
    `sdk:${auth.apiKey.project_id}`,
    SDK_INGEST.rateLimit.max,
    SDK_INGEST.rateLimit.windowMs,
  );
  if (!limit.allowed) {
    throw new RateLimitError("Too many requests. Slow down.");
  }

  return {
    admin,
    projectId: auth.project.id,
    userId: auth.apiKey.user_id,
    environment: auth.apiKey.environment,
    ip,
  };
}

/**
 * Reads, size-limits, optionally gunzips and validates a request body.
 */
export async function readSdkBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
  maxBytes: number,
): Promise<T> {
  const compressed = Buffer.from(await request.arrayBuffer());
  if (compressed.byteLength > maxBytes) {
    throw new PayloadTooLargeError();
  }

  let raw = compressed;
  const encoding = request.headers.get("content-encoding");
  if (encoding && encoding.toLowerCase().includes("gzip")) {
    raw = gunzipSync(compressed);
    // Expanded payload must respect the same limit as uncompressed bodies.
    if (raw.byteLength > maxBytes) {
      throw new PayloadTooLargeError();
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString("utf8"));
  } catch {
    throw new ValidationError("Invalid JSON payload.");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new ValidationError(
      "Invalid payload.",
      result.error.flatten().fieldErrors,
    );
  }
  return result.data;
}
