import { ok, withErrorHandling } from "@/lib/api-response";
import { RateLimitError, UnauthorizedError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/services/auth";
import { requireMembership } from "@/services/workspace";
import { searchWorkspace } from "@/services/workspace/search.service";
import { createSupabaseServerClient } from "@/supabase/server";

/** Command palette search — success envelope: `{ success, data: { items } }`. */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    throw new UnauthorizedError();
  }

  const limit = rateLimit(`workspace:search:${user.id}`, 60, 60_000);
  if (!limit.allowed) {
    throw new RateLimitError("Too many search requests. Please slow down.");
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 128);
  const workspaceId = url.searchParams.get("workspaceId") ?? "";
  if (!workspaceId || q.trim().length < 1) {
    return ok({ items: [] });
  }

  await requireMembership(supabase, workspaceId, user.id);
  const items = await searchWorkspace(supabase, user.id, workspaceId, q);
  return ok({ items });
});
