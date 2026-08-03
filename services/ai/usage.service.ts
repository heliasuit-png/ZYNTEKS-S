import "server-only";

import { AI_MONTHLY_MESSAGE_LIMITS } from "@/lib/constants";
import { ForbiddenError } from "@/lib/errors";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { SubscriptionPlan } from "@/types/database";
import type { TokenUsage, UsageSummary } from "@/services/ai/types";

type Supabase = TypedSupabaseClient;

/** ISO timestamp for the first instant of the current UTC month. */
function monthStartIso(now = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

function limitForPlan(plan: SubscriptionPlan): number | null {
  return AI_MONTHLY_MESSAGE_LIMITS[plan];
}

/** Counts billable AI messages (assistant completions) in the current month. */
export async function getMonthlyMessageCount(
  supabase: Supabase,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStartIso());

  if (error) {
    throw error;
  }
  return count ?? 0;
}

/** Sums token usage for the current month via paginated reads. */
async function getMonthlyTokens(
  supabase: Supabase,
  userId: string,
): Promise<number> {
  const pageSize = 1000;
  let from = 0;
  let total = 0;

  for (;;) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("ai_usage")
      .select("total_tokens")
      .eq("user_id", userId)
      .gte("created_at", monthStartIso())
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    const rows = data ?? [];
    total += rows.reduce((sum, row) => sum + (row.total_tokens ?? 0), 0);
    if (rows.length < pageSize) {
      break;
    }
    from += pageSize;
    // Hard stop guards pathological accounts from unbounded loops.
    if (from > 100_000) {
      break;
    }
  }

  return total;
}

export async function getUsageSummary(
  supabase: Supabase,
  userId: string,
  plan: SubscriptionPlan,
): Promise<UsageSummary> {
  const [used, tokensThisMonth] = await Promise.all([
    getMonthlyMessageCount(supabase, userId),
    getMonthlyTokens(supabase, userId),
  ]);

  const limit = limitForPlan(plan);
  const remaining = limit === null ? null : Math.max(0, limit - used);
  const blocked = limit !== null && used >= limit;

  return { used, limit, remaining, tokensThisMonth, blocked };
}

/** Throws {@link ForbiddenError} when the monthly quota is exhausted. */
export async function assertWithinUsageLimit(
  supabase: Supabase,
  userId: string,
  plan: SubscriptionPlan,
): Promise<void> {
  const limit = limitForPlan(plan);
  if (limit === null) {
    return;
  }
  const used = await getMonthlyMessageCount(supabase, userId);
  if (used >= limit) {
    throw new ForbiddenError(
      `You have reached your monthly limit of ${limit} AI messages. Upgrade your plan to continue.`,
    );
  }
}

export interface RecordUsageInput {
  conversationId: string | null;
  messageId: string | null;
  model: string;
  usage: TokenUsage;
}

export async function recordUsage(
  supabase: Supabase,
  userId: string,
  input: RecordUsageInput,
): Promise<void> {
  const { error } = await supabase.from("ai_usage").insert({
    user_id: userId,
    conversation_id: input.conversationId,
    message_id: input.messageId,
    model: input.model,
    prompt_tokens: input.usage.promptTokens,
    completion_tokens: input.usage.completionTokens,
    total_tokens: input.usage.totalTokens,
  });

  if (error) {
    throw error;
  }
}
