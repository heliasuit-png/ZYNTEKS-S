import type { NextRequest } from "next/server";

import { ok, withErrorHandling } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { revokeApiKey } from "@/services/api-keys";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(
  async (_request: NextRequest, context: RouteContext) => {
    const { supabase, user } = await requireApiUser();
    const { id } = await context.params;
    const apiKey = await revokeApiKey(supabase, user.id, id);
    return ok(apiKey);
  },
);
