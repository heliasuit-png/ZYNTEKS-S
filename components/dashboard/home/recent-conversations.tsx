import { MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { formatDate } from "@/utils/format";
import type { AiConversation } from "@/types/dashboard";

export function RecentConversations({
  conversations,
}: {
  conversations: AiConversation[];
}) {
  return (
    <Panel className="h-full">
      <PanelHeader>
        <PanelTitle>Recent AI Conversations</PanelTitle>
      </PanelHeader>
      <PanelContent>
        {conversations.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No conversations yet"
            description="Ask the AI assistant about errors, performance, or architecture. Your recent chats will show up here."
            action={
              <Link
                href={DASHBOARD_ROUTES.aiAssistant}
                className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
              >
                <Sparkles className="size-4" aria-hidden />
                Open AI Assistant
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-zt-primary/15 text-zt-primary">
                  <MessageSquare className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <Link
                    href={`${DASHBOARD_ROUTES.aiAssistant}?c=${conversation.id}`}
                    className="truncate text-sm font-medium text-zt-text hover:text-zt-primary"
                  >
                    {conversation.title}
                  </Link>
                  <p className="truncate text-xs text-zt-muted">
                    {conversation.model} · {conversation.messageCount} messages ·{" "}
                    {formatDate(conversation.updatedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelContent>
    </Panel>
  );
}
