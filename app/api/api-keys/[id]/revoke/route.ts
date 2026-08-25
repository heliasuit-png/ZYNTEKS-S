import type { NextRequest } from "next/server";

import { ok, withErrorHandling } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { RateLimitError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { revokeApiKey } from "@/services/api-keys";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(
  async (_request: NextRequest, context: RouteContext) => {
    const { supabase, user } = await requireApiUser();
    const limit = rateLimit(`api-keys:revoke:${user.id}`, 30, 60_000);
    if (!limit.allowed) {
      throw new RateLimitError("Too many API key operations. Please try again shortly.");
    }
    const { id } = await context.params;
    const apiKey = await revokeApiKey(supabase, user.id, id);
    return ok(apiKey);
  },
);
