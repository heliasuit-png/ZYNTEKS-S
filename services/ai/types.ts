import type { Database } from "@/types/database";

export type AiConversation =
  Database["public"]["Tables"]["ai_conversations"]["Row"];
export type AiMessage = Database["public"]["Tables"]["ai_messages"]["Row"];
export type AiUsageRecord = Database["public"]["Tables"]["ai_usage"]["Row"];

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

/** Formatted, read-only project context injected into the system prompt. */
export interface AiContext {
  text: string;
  hasProject: boolean;
}

export interface UsageSummary {
  used: number;
  /** `null` means unlimited. */
  limit: number | null;
  remaining: number | null;
  tokensThisMonth: number;
  blocked: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type AiStreamEvent =
  | { type: "meta"; conversationId: string }
  | { type: "delta"; text: string }
  | { type: "done"; messageId: string; usage: TokenUsage }
  | { type: "error"; message: string };
