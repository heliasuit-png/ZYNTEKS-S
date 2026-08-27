"use client";

import { MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useDictionary } from "@/components/i18n/locale-provider";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { formatDate } from "@/utils/format";
import type { AiConversation } from "@/types/dashboard";

export function RecentConversations({
  conversations,
}: {
  conversations: AiConversation[];
}) {
  const { dict } = useDictionary();
  const t = dict.dash.home.recentConversations;
  const openAi = dict.dash.home.quickActions.openAiAssistant;

  return (
    <Panel className="h-full">
      <PanelHeader>
        <PanelTitle>{t.title}</PanelTitle>
      </PanelHeader>
      <PanelContent>
        {conversations.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={t.empty}
            description={t.emptyDesc}
            action={
              <Link
                href={DASHBOARD_ROUTES.aiAssistant}
                className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
              >
                <Sparkles className="size-4" aria-hidden />
                {openAi}
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
                    {conversation.model} ·{" "}
                    {fillTemplate(t.messages, {
                      count: conversation.messageCount,
                    })}{" "}
                    · {formatDate(conversation.updatedAt)}
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
