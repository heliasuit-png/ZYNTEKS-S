import "server-only";

import { aiConfig, getOpenAIClient } from "@/ai";
import { AI } from "@/lib/constants";
import { BadRequestError } from "@/lib/errors";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { SubscriptionPlan } from "@/types/database";

import { buildProjectContext } from "@/services/ai/context.builder";
import {
  appendMessage,
  createConversation,
  deleteLastAssistantMessage,
  getConversation,
  getHistory,
  getLastUserMessage,
  renameConversation,
} from "@/services/ai/conversation.service";
import {
  buildInstructions,
  deriveTitle,
  sanitizeUserMessage,
  toResponsesInput,
} from "@/services/ai/prompt.builder";
import type { StreamEmitter } from "@/services/ai/streaming";
import { recordUsage } from "@/services/ai/usage.service";
import type { TokenUsage } from "@/services/ai/types";
import { parsePreferences } from "@/features/settings/lib/preferences";

type Supabase = TypedSupabaseClient;

export interface ChatParams {
  supabase: Supabase;
  userId: string;
  plan: SubscriptionPlan;
  conversationId?: string | null;
  projectId?: string | null;
  message?: string;
  regenerate?: boolean;
  signal?: AbortSignal;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "APIUserAbortError")
  );
}

/**
 * Orchestrates a single streaming chat turn: resolves the conversation,
 * persists the user turn, builds read-only context, streams the model response
 * and records the assistant turn plus token usage. Everything is emitted to the
 * client as it happens.
 */
export async function handleChat(
  params: ChatParams,
  emit: StreamEmitter,
): Promise<void> {
  const { supabase, userId, signal } = params;

  const { data: profilePrefs } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();
  const aiPrefs = parsePreferences(profilePrefs?.preferences).ai;
  const model = aiPrefs.defaultModel || aiConfig.defaultModel;
  const streamingEnabled = aiPrefs.streaming;

  const conversation = params.conversationId
    ? await getConversation(supabase, userId, params.conversationId)
    : await createConversation(supabase, userId, {
        projectId: params.projectId ?? null,
        model,
      });

  const isNewConversation = !params.conversationId;

  if (params.regenerate) {
    const lastUser = await getLastUserMessage(supabase, userId, conversation.id);
    if (!lastUser) {
      throw new BadRequestError("Nothing to regenerate.");
    }
    await deleteLastAssistantMessage(supabase, userId, conversation.id);
  } else {
    const sanitized = sanitizeUserMessage(params.message ?? "");
    if (!sanitized) {
      throw new BadRequestError("A message is required.");
    }
    await appendMessage(supabase, userId, {
      conversationId: conversation.id,
      role: "user",
      content: sanitized,
    });
    if (isNewConversation) {
      await renameConversation(
        supabase,
        userId,
        conversation.id,
        deriveTitle(sanitized),
      );
    }
  }

  emit({ type: "meta", conversationId: conversation.id });

  const context = await buildProjectContext(
    supabase,
    userId,
    conversation.project_id,
  );
  const history = await getHistory(supabase, userId, conversation.id);
  const instructions = buildInstructions(context);
  const input = toResponsesInput(history);

  const client = getOpenAIClient();

  let assistantText = "";
  const usage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  try {
    const stream = await client.responses.create(
      {
        model,
        instructions,
        input,
        temperature: AI.temperature,
        stream: true,
      },
      { signal },
    );

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        assistantText += event.delta;
        if (streamingEnabled) {
          emit({ type: "delta", text: event.delta });
        }
      } else if (event.type === "response.completed") {
        const u = event.response.usage;
        if (u) {
          usage.promptTokens = u.input_tokens;
          usage.completionTokens = u.output_tokens;
          usage.totalTokens = u.total_tokens;
        }
      }
    }

    if (!streamingEnabled && assistantText) {
      emit({ type: "delta", text: assistantText });
    }
  } catch (error) {
    if (!isAbortError(error)) {
      throw error;
    }
  }

  // Persist whatever was streamed (including aborted partials) so history and
  // feedback stay consistent. Always emit `done` with the persisted id when
  // content exists so the client can replace its temporary message id.
  if (assistantText.trim().length === 0) {
    emit({
      type: "done",
      messageId: "",
      usage,
    });
    return;
  }

  const assistantMessage = await appendMessage(supabase, userId, {
    conversationId: conversation.id,
    role: "assistant",
    content: assistantText,
    model,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  });

  await recordUsage(supabase, userId, {
    conversationId: conversation.id,
    messageId: assistantMessage.id,
    model,
    usage,
  });

  emit({ type: "done", messageId: assistantMessage.id, usage });
}
