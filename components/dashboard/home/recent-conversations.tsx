import { MessageSquare, Sparkles } from "lucide-react";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { EmptyState } from "@/components/dashboard/empty-state";
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
            description="Start chatting with the AI Assistant to see history here."
          />
        ) : (
          <ul className="space-y-3">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-zt-primary/15 text-zt-primary">
                  <MessageSquare className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zt-text">
                    {conversation.title}
                  </p>
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
