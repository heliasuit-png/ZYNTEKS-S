import { emptyPage, createPage, normalizePagination } from "@/services/dashboard/pagination";
import { getAuthenticatedUser } from "@/services/auth";
import { listConversations as listUserConversations } from "@/services/ai";
import { createSupabaseServerClient } from "@/supabase/server";
import type {
  AiConversation,
  Paginated,
  PaginationParams,
} from "@/types/dashboard";

/**
 * Dashboard seam for AI conversations. Reads the current user's conversations
 * and maps them to the dashboard view model.
 */
export async function listConversations(
  params?: Partial<PaginationParams>,
): Promise<Paginated<AiConversation>> {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return emptyPage<AiConversation>(params);
    }

    const pagination = normalizePagination(params ?? {});
    const rows = await listUserConversations(supabase, user.id, {
      limit: pagination.page * pagination.pageSize,
    });

    const from = (pagination.page - 1) * pagination.pageSize;
    const slice = rows.slice(from, from + pagination.pageSize);

    const items: AiConversation[] = slice.map((row) => ({
      id: row.id,
      title: row.title,
      model: row.model,
      messageCount: row.message_count,
      updatedAt: row.updated_at,
    }));

    return createPage(items, rows.length, pagination);
  } catch {
    return emptyPage<AiConversation>(params);
  }
}

export async function getRecentConversations(
  limit = 5,
): Promise<AiConversation[]> {
  const page = await listConversations({ page: 1, pageSize: limit });
  return page.items;
}
