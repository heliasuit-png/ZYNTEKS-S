import type { NextRequest } from "next/server";

import { ok, withErrorHandling } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { regenerateApiKey } from "@/services/api-keys";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(
  async (_request: NextRequest, context: RouteContext) => {
    const { supabase, user } = await requireApiUser();
    const { id } = await context.params;
    const result = await regenerateApiKey(supabase, user.id, id);
    return ok(result);
  },
);
