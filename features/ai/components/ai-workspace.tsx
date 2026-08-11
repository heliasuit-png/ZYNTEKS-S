"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Plus, Search, Send, Sparkles, Square, X } from "lucide-react";

import { API_ROUTES, DASHBOARD_ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AiInfinity } from "@/components/dashboard/home/ai-infinity";
import { ChatMessage } from "@/features/ai/components/chat-message";
import { ConversationItem } from "@/features/ai/components/conversation-item";
import { setConversationProjectAction } from "@/features/ai/actions";
import { SUGGESTED_ANALYSES } from "@/features/ai/prompts";
import type {
  ChatMessageView,
  ConversationListItem,
  ProjectOption,
  UsageView,
} from "@/features/ai/types";

const PROJECT_MEMORY_KEY = "zt:ai:project";

interface AiWorkspaceProps {
  conversations: ConversationListItem[];
  selectedId: string | null;
  initialMessages: ChatMessageView[];
  usage: UsageView;
  projects: ProjectOption[];
  selectedProjectId: string | null;
  /** Optional starter prompt from a deep-link intent (AI Core action cards). */
  initialPrompt?: string;
}

function tempId(): string {
  return `temp-${Math.random().toString(36).slice(2)}`;
}

function updateAssistant(
  messages: ChatMessageView[],
  id: string,
  updater: (message: ChatMessageView) => ChatMessageView,
): ChatMessageView[] {
  return messages.map((message) => (message.id === id ? updater(message) : message));
}

type StreamEvent =
  | { type: "meta"; conversationId: string }
  | { type: "delta"; text: string }
  | { type: "done"; messageId: string }
  | { type: "error"; message: string };

function parseStreamEvent(line: string): StreamEvent | null {
  try {
    const event = JSON.parse(line) as StreamEvent;
    if (
      event &&
      typeof event === "object" &&
      "type" in event &&
      (event.type === "meta" ||
        event.type === "delta" ||
        event.type === "done" ||
        event.type === "error")
    ) {
      return event;
    }
    return null;
  } catch {
    return null;
  }
}

export function AiWorkspace({
  conversations,
  selectedId,
  initialMessages,
  usage,
  projects,
  selectedProjectId,
  initialPrompt,
}: AiWorkspaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(selectedId);
  const [projectId, setProjectId] = useState<string | null>(selectedProjectId);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [projectPending, startProjectTransition] = useTransition();

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  // Coalesce scroll into one rAF per frame — never smooth-scroll on every token.
  useEffect(() => {
    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
    return () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [messages]);

  // Prefill a starter prompt from a deep-link intent on a fresh conversation.
  useEffect(() => {
    if (initialPrompt && !selectedId && initialMessages.length === 0) {
      setInput(initialPrompt);
      const id = window.setTimeout(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      }, 60);
      return () => window.clearTimeout(id);
    }
  }, [initialPrompt, selectedId, initialMessages.length]);

  // Remember the last selected project across new conversations.
  useEffect(() => {
    if (selectedId) return;
    try {
      const saved = window.localStorage.getItem(PROJECT_MEMORY_KEY);
      if (saved && projects.some((p) => p.id === saved)) {
        setProjectId(saved);
      }
    } catch {
      // localStorage unavailable — keep the default.
    }
  }, [selectedId, projects]);

  // Abort in-flight chat streams when the workspace unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  // Sync when the selected conversation changes (sidebar / ?c=). No remount key
  // on the page — remounting raced Framer Motion template + stream settle.
  const selectionRef = useRef(selectedId);
  useEffect(() => {
    if (selectionRef.current === selectedId) {
      return;
    }
    selectionRef.current = selectedId;
    abortRef.current?.abort();
    setConversationId(selectedId);
    setMessages(initialMessages);
    setProjectId(selectedProjectId);
    setError(null);
    setStreaming(false);
  }, [selectedId, initialMessages, selectedProjectId]);

  function rememberProject(next: string | null) {
    try {
      if (next) {
        window.localStorage.setItem(PROJECT_MEMORY_KEY, next);
      } else {
        window.localStorage.removeItem(PROJECT_MEMORY_KEY);
      }
    } catch {
      // best-effort persistence only
    }
  }

  function selectProject(next: string | null) {
    setProjectId(next);
    rememberProject(next);

    if (!conversationId) {
      return;
    }

    startProjectTransition(async () => {
      const fd = new FormData();
      fd.set("id", conversationId);
      if (next) fd.set("projectId", next);
      const result = await setConversationProjectAction(fd);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function useSuggestion(prompt: string) {
    setInput(prompt);
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(prompt.length, prompt.length);
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return conversations;
    }
    return conversations.filter((c) => c.title.toLowerCase().includes(term));
  }, [conversations, search]);

  const pinned = filtered.filter((c) => c.pinned);
  const rest = filtered.filter((c) => !c.pinned);
  const searching = search.trim().length > 0;

  const blocked = usage.limit !== null && usage.remaining !== null && usage.remaining <= 0;

  async function runChat(regenerate: boolean, messageText?: string) {
    if (streaming || blocked) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);

    if (!regenerate) {
      const text = (messageText ?? "").trim();
      if (!text) {
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: tempId(), role: "user", content: text },
      ]);
      setInput("");
    } else {
      setMessages((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i -= 1) {
          if (copy[i]?.role === "assistant") {
            copy.splice(i, 1);
            break;
          }
        }
        return copy;
      });
    }

    const assistantId = tempId();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        renderKey: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
      },
    ]);
    setStreaming(true);

    try {
      const response = await fetch(API_ROUTES.aiChat, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          projectId: projectId ?? undefined,
          message: regenerate ? undefined : messageText,
          regenerate,
        }),
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(data?.error?.message ?? "The assistant request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let createdId: string | null = conversationId;
      let finalId: string | undefined;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex >= 0) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          newlineIndex = buffer.indexOf("\n");
          if (!line) {
            continue;
          }
          const event = parseStreamEvent(line);
          if (!event) {
            continue;
          }

          if (event.type === "meta") {
            createdId = event.conversationId;
            setConversationId(event.conversationId);
          } else if (event.type === "delta") {
            setMessages((prev) =>
              updateAssistant(prev, assistantId, (m) => ({
                ...m,
                content: m.content + event.text,
              })),
            );
          } else if (event.type === "done") {
            finalId = event.messageId || undefined;
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }

      setMessages((prev) => {
        const current = prev.find((m) => m.id === assistantId);
        // Empty aborted/failed assistant turns should not linger.
        if (current && !current.content.trim() && !finalId) {
          return prev.filter((m) => m.id !== assistantId);
        }
        return updateAssistant(prev, assistantId, (m) => ({
          ...m,
          streaming: false,
          // Persist UUID for feedback; renderKey stays assistantId (stable list key).
          id: finalId ?? m.id,
          renderKey: m.renderKey ?? assistantId,
        }));
      });

      // Let React commit streaming→markdown before dashboard template motion runs.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      if (!conversationId && createdId) {
        router.replace(`${DASHBOARD_ROUTES.aiAssistant}?c=${createdId}`);
      }
      router.refresh();
    } catch (caught) {
      const err = caught as Error;
      if (err.name === "AbortError") {
        setMessages((prev) => {
          const current = prev.find((m) => m.id === assistantId);
          if (!current?.content.trim()) {
            return prev.filter((m) => m.id !== assistantId);
          }
          return updateAssistant(prev, assistantId, (m) => ({
            ...m,
            streaming: false,
            renderKey: m.renderKey ?? assistantId,
          }));
        });
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });
        router.refresh();
      } else {
        setError(err.message);
        setMessages((prev) =>
          prev.filter((m) => !(m.id === assistantId && m.content === "")),
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void runChat(false, input);
  }

  function stop() {
    abortRef.current?.abort();
  }

  const lastMessage = messages[messages.length - 1];
  const canRegenerate =
    !streaming &&
    lastMessage?.role === "assistant" &&
    !lastMessage.streaming &&
    messages.some((m) => m.role === "user");

  const historyList = (
    <>
      <div className="space-y-3 border-b border-zt-border p-3">
        <Link
          href={DASHBOARD_ROUTES.aiAssistant}
          onClick={() => setHistoryOpen(false)}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-zt-primary to-zt-purple text-sm font-medium text-white shadow-lg shadow-zt-primary/25 transition-transform hover:-translate-y-0.5"
        >
          <Plus className="size-4" aria-hidden />
          New chat
        </Link>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zt-muted"
            aria-hidden
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="h-9 w-full rounded-lg border border-zt-border bg-zt-surface-2 pl-8 pr-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-zt-muted">
            {searching
              ? `No conversations match “${search.trim()}”.`
              : "No conversations yet."}
          </p>
        ) : null}

        {pinned.length > 0 ? (
          <div className="space-y-0.5">
            <p className="px-2 text-xs font-medium uppercase tracking-wide text-zt-muted">
              Pinned
            </p>
            {pinned.map((c) => (
              <div key={c.id} onClick={() => setHistoryOpen(false)}>
                <ConversationItem
                  conversation={c}
                  active={c.id === conversationId}
                />
              </div>
            ))}
          </div>
        ) : null}

        {rest.length > 0 ? (
          <div className="space-y-0.5">
            {pinned.length > 0 ? (
              <p className="px-2 text-xs font-medium uppercase tracking-wide text-zt-muted">
                Recent
              </p>
            ) : null}
            {rest.map((c) => (
              <div key={c.id} onClick={() => setHistoryOpen(false)}>
                <ConversationItem
                  conversation={c}
                  active={c.id === conversationId}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t border-zt-border p-3 text-xs text-zt-muted">
        <p>
          {usage.limit === null
            ? `${usage.used} messages this month · Unlimited`
            : `${usage.used} / ${usage.limit} messages this month`}
        </p>
        <p className="mt-1">
          ~{usage.tokensThisMonth.toLocaleString()} tokens used
        </p>
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-7.5rem)] gap-4">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col rounded-2xl border border-zt-border bg-zt-surface md:flex">
        {historyList}
      </aside>

      {/* Mobile history drawer */}
      {historyOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close history"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setHistoryOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-zt-border bg-zt-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-zt-border px-3 py-3">
              <p className="text-sm font-medium text-zt-text">Conversations</p>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1 text-zt-muted hover:text-zt-text"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {historyList}
          </aside>
        </div>
      ) : null}

      {/* Chat panel */}
      <section className="flex flex-1 flex-col rounded-2xl border border-zt-border bg-zt-surface">
        <header className="flex items-center justify-between gap-3 border-b border-zt-border px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Open conversation history"
              className="flex size-8 items-center justify-center rounded-lg border border-zt-border text-zt-muted hover:text-zt-text md:hidden"
            >
              <Menu className="size-4" aria-hidden />
            </button>
            <Sparkles className="size-4 text-zt-primary" aria-hidden />
            <span className="text-sm font-medium text-zt-text">
              Code Health Assistant
            </span>
          </div>
          {projects.length > 0 ? (
            <select
              value={projectId ?? ""}
              onChange={(e) => selectProject(e.target.value || null)}
              aria-label="Attach a project for context"
              disabled={projectPending}
              className="h-8 max-w-[12rem] rounded-lg border border-zt-border bg-zt-surface-2 px-2 text-xs text-zt-text focus:outline-none focus:ring-2 focus:ring-zt-primary/40 disabled:opacity-60"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="rounded-full border border-zt-border px-2.5 py-1 text-xs text-zt-muted">
              No project
            </span>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {/*
            Keep empty-state (AiInfinity / Framer Motion) mounted and CSS-hidden
            when messages appear. An exclusive ternary unmounted motion nodes
            while ChatMessage mounted → insertBefore NotFoundError.
          */}
          <div
            className={cn(
              "flex h-full flex-col items-center justify-center text-center",
              messages.length > 0 && "hidden",
            )}
            aria-hidden={messages.length > 0}
          >
            <AiInfinity size={200} className="mb-4" />
            <h3 className="text-base font-medium text-zt-text">
              How can I help with your code health?
            </h3>
            <p className="mt-1 max-w-sm text-sm text-zt-muted">
              Ask about errors, incidents, performance, security, or
              architecture. Attach a project for tailored, evidence-based
              answers with confidence and related signals.
            </p>
            <div className="mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2">
              {SUGGESTED_ANALYSES.map((s) => (
                <button
                  key={s.intent}
                  type="button"
                  onClick={() => useSuggestion(s.prompt)}
                  className="zt-glass rounded-full border border-zt-border px-3 py-1.5 text-xs text-zt-muted transition-colors hover:border-zt-border-strong hover:text-zt-text"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={cn("space-y-4", messages.length === 0 && "hidden")}
            translate="no"
          >
            {messages.map((message, index) => (
              <ChatMessage
                key={message.renderKey ?? message.id}
                message={message}
                canRegenerate={canRegenerate && index === messages.length - 1}
                onRegenerate={() => void runChat(true)}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-zt-border p-3">
          {error ? (
            <p className="mb-2 text-xs text-zt-danger" role="alert">
              {error}
            </p>
          ) : null}
          {blocked ? (
            <p className="mb-2 text-xs text-zt-warning" role="status">
              You have reached your monthly AI message limit. Upgrade your plan
              to continue.
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void runChat(false, input);
                }
              }}
              rows={1}
              placeholder="Ask the assistant anything…"
              aria-label="Message the assistant"
              disabled={blocked}
              className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40 disabled:opacity-50"
            />
            {streaming ? (
              <button
                type="button"
                onClick={stop}
                className="flex h-10 items-center gap-2 rounded-xl border border-zt-border bg-zt-surface-2 px-4 text-sm font-medium text-zt-text transition-colors hover:bg-zt-surface"
              >
                <Square className="size-4" aria-hidden />
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={blocked || !input.trim()}
                className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-zt-primary to-zt-purple px-4 text-sm font-medium text-white shadow-lg shadow-zt-primary/25 transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
              >
                <Send className="size-4" aria-hidden />
                Send
              </button>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
