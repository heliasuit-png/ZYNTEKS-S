import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DASHBOARD_ROUTES, ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { getAuthenticatedUser } from "@/services/auth";
import { getSubscriptionPlan } from "@/services/account/plan.service";
import { listProjects } from "@/services/projects/project.service";
import {
  getConversation,
  getFeedbackForMessages,
  getMessages,
  getUsageSummary,
  listConversations,
} from "@/services/ai";
import { createSupabaseServerClient } from "@/supabase/server";
import { AiWorkspace } from "@/features/ai/components/ai-workspace";
import { promptForIntent } from "@/features/ai/prompts";
import type {
  ChatMessageView,
  ConversationListItem,
  ProjectOption,
} from "@/features/ai/types";

export const metadata: Metadata = { title: "AI Assistant" };

export default async function AiAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{
    c?: string;
    intent?: string;
    q?: string;
    project?: string;
  }>;
}) {
  const { c: requestedId, intent, q, project } = await searchParams;
  const initialPrompt = q?.trim() || promptForIntent(intent) || undefined;
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(ROUTES.login);
  }

  const [plan, conversationsRaw, projectsPage] = await Promise.all([
    getSubscriptionPlan(supabase, user.id),
    listConversations(supabase, user.id),
    listProjects(supabase, user.id, { page: 1, pageSize: 100 }),
  ]);

  const usage = await getUsageSummary(supabase, user.id, plan);

  const conversations: ConversationListItem[] = conversationsRaw.map((c) => ({
    id: c.id,
    title: c.title,
    pinned: c.pinned,
    projectId: c.project_id,
    messageCount: c.message_count,
    updatedAt: c.updated_at,
  }));

  const projects: ProjectOption[] = projectsPage.items.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  let selectedId: string | null = null;
  let initialMessages: ChatMessageView[] = [];
  let selectedProjectId: string | null =
    project && projects.some((p) => p.id === project) ? project : null;

  if (requestedId) {
    try {
      const conversation = await getConversation(supabase, user.id, requestedId);
      selectedId = conversation.id;
      selectedProjectId = conversation.project_id;
      const messages = await getMessages(supabase, user.id, conversation.id);
      const assistantIds = messages
        .filter((m) => m.role === "assistant")
        .map((m) => m.id);
      const feedback = await getFeedbackForMessages(
        supabase,
        user.id,
        assistantIds,
      );

      initialMessages = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          id: m.id,
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
          feedback: feedback[m.id] ?? null,
        }));
    } catch (error) {
      if (isAppError(error) && error.statusCode === 404) {
        redirect(DASHBOARD_ROUTES.aiAssistant);
      }
      throw error;
    }
  }

  return (
    <AiWorkspace
      key={selectedId ?? "new"}
      conversations={conversations}
      selectedId={selectedId}
      initialMessages={initialMessages}
      usage={usage}
      projects={projects}
      selectedProjectId={selectedProjectId}
      initialPrompt={initialPrompt}
    />
  );
}
