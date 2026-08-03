import "server-only";

import { AI } from "@/lib/constants";
import { NotFoundError } from "@/lib/errors";
import type { TypedSupabaseClient } from "@/supabase/client";
import type {
  AiConversation,
  AiMessage,
  ChatHistoryItem,
} from "@/services/ai/types";

type Supabase = TypedSupabaseClient;

export interface ListConversationsParams {
  search?: string;
  limit?: number;
}

/** Lists a user's conversations, pinned first then most recently active. */
export async function listConversations(
  supabase: Supabase,
  userId: string,
  params: ListConversationsParams = {},
): Promise<AiConversation[]> {
  let query = supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(params.limit ?? 100);

  if (params.search && params.search.trim()) {
    query = query.ilike("title", `%${params.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function getConversation(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<AiConversation> {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new NotFoundError("Conversation not found.");
  }
  return data;
}

export interface CreateConversationInput {
  projectId?: string | null;
  title?: string;
  model: string;
}

export async function createConversation(
  supabase: Supabase,
  userId: string,
  input: CreateConversationInput,
): Promise<AiConversation> {
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: userId,
      project_id: input.projectId ?? null,
      title: input.title ?? "New conversation",
      model: input.model,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function getMessages(
  supabase: Supabase,
  userId: string,
  conversationId: string,
): Promise<AiMessage[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }
  return data ?? [];
}

/** Returns the trailing slice of a conversation as prompt history. */
export async function getHistory(
  supabase: Supabase,
  userId: string,
  conversationId: string,
): Promise<ChatHistoryItem[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(AI.maxHistoryMessages);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .reverse()
    .map((row) => ({
      role: row.role === "assistant" ? "assistant" : "user",
      content: row.content,
    }));
}

export interface AppendMessageInput {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
}

export async function appendMessage(
  supabase: Supabase,
  userId: string,
  input: AppendMessageInput,
): Promise<AiMessage> {
  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: input.conversationId,
      user_id: userId,
      role: input.role,
      content: input.content,
      model: input.model ?? null,
      prompt_tokens: input.promptTokens ?? null,
      completion_tokens: input.completionTokens ?? null,
      total_tokens: input.totalTokens ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function getLastUserMessage(
  supabase: Supabase,
  userId: string,
  conversationId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("content")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data?.content ?? null;
}

/** Deletes the most recent assistant message (used when regenerating). */
export async function deleteLastAssistantMessage(
  supabase: Supabase,
  userId: string,
  conversationId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("ai_messages")
    .delete()
    .eq("id", data.id)
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }
}

export async function renameConversation(
  supabase: Supabase,
  userId: string,
  id: string,
  title: string,
): Promise<void> {
  const { error } = await supabase
    .from("ai_conversations")
    .update({ title })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}

export async function setConversationPinned(
  supabase: Supabase,
  userId: string,
  id: string,
  pinned: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("ai_conversations")
    .update({ pinned })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}

export async function deleteConversation(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}

/** Attaches (or clears) the project used for read-only AI context. */
export async function setConversationProject(
  supabase: Supabase,
  userId: string,
  id: string,
  projectId: string | null,
): Promise<void> {
  if (projectId) {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();
    if (projectError) {
      throw projectError;
    }
    if (!project) {
      throw new NotFoundError("Project not found.");
    }
  }

  const { error } = await supabase
    .from("ai_conversations")
    .update({ project_id: projectId })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}

/** Loads thumbs feedback for a set of assistant messages. */
export async function getFeedbackForMessages(
  supabase: Supabase,
  userId: string,
  messageIds: string[],
): Promise<Record<string, "up" | "down">> {
  if (messageIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("ai_feedback")
    .select("message_id, rating")
    .eq("user_id", userId)
    .in("message_id", messageIds);

  if (error) {
    throw error;
  }

  const map: Record<string, "up" | "down"> = {};
  for (const row of data ?? []) {
    if (row.rating === "up" || row.rating === "down") {
      map[row.message_id] = row.rating;
    }
  }
  return map;
}
