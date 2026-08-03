"use server";

import { revalidatePath } from "next/cache";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { requireApiUser } from "@/lib/api-auth";
import { NotFoundError } from "@/lib/errors";
import {
  deleteConversation,
  renameConversation,
  setConversationPinned,
  setConversationProject,
} from "@/services/ai";
import {
  conversationIdSchema,
  feedbackSchema,
  pinConversationSchema,
  renameConversationSchema,
  setConversationProjectSchema,
} from "@/features/ai/schemas";

function revalidateAi(): void {
  revalidatePath(DASHBOARD_ROUTES.aiAssistant);
}

export type AiActionResult = { ok: true } | { ok: false; error: string };

export async function renameConversationAction(
  formData: FormData,
): Promise<AiActionResult> {
  const parsed = renameConversationSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid title." };
  }
  try {
    const { supabase, user } = await requireApiUser();
    await renameConversation(
      supabase,
      user.id,
      parsed.data.id,
      parsed.data.title,
    );
    revalidateAi();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Rename failed.",
    };
  }
}

export async function pinConversationAction(
  formData: FormData,
): Promise<AiActionResult> {
  const parsed = pinConversationSchema.safeParse({
    id: formData.get("id"),
    pinned: formData.get("pinned"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid pin request." };
  }
  try {
    const { supabase, user } = await requireApiUser();
    await setConversationPinned(
      supabase,
      user.id,
      parsed.data.id,
      parsed.data.pinned,
    );
    revalidateAi();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Pin failed.",
    };
  }
}

export async function deleteConversationAction(
  formData: FormData,
): Promise<AiActionResult> {
  const parsed = conversationIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { ok: false, error: "Invalid conversation." };
  }
  try {
    const { supabase, user } = await requireApiUser();
    await deleteConversation(supabase, user.id, parsed.data.id);
    revalidateAi();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Delete failed.",
    };
  }
}

export async function setConversationProjectAction(
  formData: FormData,
): Promise<AiActionResult> {
  const parsed = setConversationProjectSchema.safeParse({
    id: formData.get("id"),
    projectId: formData.get("projectId") || null,
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid project selection." };
  }
  try {
    const { supabase, user } = await requireApiUser();
    await setConversationProject(
      supabase,
      user.id,
      parsed.data.id,
      parsed.data.projectId,
    );
    revalidateAi();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update project.",
    };
  }
}

export async function submitFeedbackAction(
  formData: FormData,
): Promise<AiActionResult> {
  const parsed = feedbackSchema.safeParse({
    messageId: formData.get("messageId"),
    rating: formData.get("rating"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid feedback." };
  }
  try {
    const { supabase, user } = await requireApiUser();

    // Ensure the message belongs to this user before writing feedback.
    const { data: message, error: messageError } = await supabase
      .from("ai_messages")
      .select("id")
      .eq("id", parsed.data.messageId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (messageError) {
      throw messageError;
    }
    if (!message) {
      throw new NotFoundError("Message not found.");
    }

    const { error } = await supabase.from("ai_feedback").upsert(
      {
        message_id: parsed.data.messageId,
        user_id: user.id,
        rating: parsed.data.rating,
      },
      { onConflict: "message_id,user_id" },
    );

    if (error) {
      throw error;
    }

    revalidateAi();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Feedback failed.",
    };
  }
}
