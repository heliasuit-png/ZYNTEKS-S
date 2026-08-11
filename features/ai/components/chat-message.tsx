"use client";

import { useState, useTransition } from "react";
import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { submitFeedbackAction } from "@/features/ai/actions";
import { MarkdownMessage } from "@/components/markdown/markdown-message";
import type { ChatMessageView } from "@/features/ai/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore clipboard failures
        }
      }}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zt-muted transition-colors hover:text-zt-text"
      aria-label="Copy message"
    >
      {copied ? (
        <Check className="size-3.5 text-zt-success" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function ChatMessage({
  message,
  canRegenerate,
  onRegenerate,
}: {
  message: ChatMessageView;
  canRegenerate: boolean;
  onRegenerate: () => void;
}) {
  const isUser = message.role === "user";
  const persisted = UUID_RE.test(message.id);
  const [rating, setRating] = useState<"up" | "down" | null>(
    message.feedback ?? null,
  );
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function rate(next: "up" | "down") {
    if (!persisted || pending) return;
    setFeedbackError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("messageId", message.id);
      fd.set("rating", next);
      const result = await submitFeedbackAction(fd);
      if (result.ok) {
        setRating(next);
      } else {
        setFeedbackError(result.error);
      }
    });
  }

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-zt-primary/15 text-zt-text"
            : "border border-zt-border bg-zt-surface-2/40 text-zt-text",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <div aria-live="polite">
            {/* Stable container: Thinking / stream text / final markdown stay here. */}
            <div className="min-h-[1.25rem]">
              {message.streaming && !message.content ? (
                <p className="flex items-center gap-2 text-sm text-zt-muted">
                  <span
                    className="size-2 animate-pulse rounded-full bg-zt-primary"
                    aria-hidden
                  />
                  Thinking…
                </p>
              ) : null}
              {message.content ? (
                <MarkdownMessage
                  content={message.content}
                  streaming={Boolean(message.streaming)}
                />
              ) : null}
            </div>

            {!message.streaming && message.content ? (
              <div className="mt-2 border-t border-zt-border/60 pt-2">
                <div className="flex items-center gap-1">
                  <CopyButton value={message.content} />
                  {canRegenerate ? (
                    <button
                      type="button"
                      onClick={onRegenerate}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zt-muted transition-colors hover:text-zt-text"
                    >
                      <RefreshCw className="size-3.5" aria-hidden />
                      Regenerate
                    </button>
                  ) : null}
                  {persisted ? (
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => rate("up")}
                        disabled={pending}
                        aria-label="Helpful"
                        aria-pressed={rating === "up"}
                        className={cn(
                          "rounded-md p-1 transition-colors",
                          rating === "up"
                            ? "bg-zt-success/15 text-zt-success"
                            : "text-zt-muted hover:text-zt-success",
                        )}
                      >
                        <ThumbsUp className="size-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => rate("down")}
                        disabled={pending}
                        aria-label="Not helpful"
                        aria-pressed={rating === "down"}
                        className={cn(
                          "rounded-md p-1 transition-colors",
                          rating === "down"
                            ? "bg-zt-danger/15 text-zt-danger"
                            : "text-zt-muted hover:text-zt-danger",
                        )}
                      >
                        <ThumbsDown className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  ) : null}
                </div>
                {feedbackError ? (
                  <p className="mt-1 text-[11px] text-zt-danger">{feedbackError}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
