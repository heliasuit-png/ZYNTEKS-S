"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Pin,
  PinOff,
  Trash2,
  Pencil,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import {
  deleteConversationAction,
  pinConversationAction,
  renameConversationAction,
} from "@/features/ai/actions";
import type { ConversationListItem } from "@/features/ai/types";

export function ConversationItem({
  conversation,
  active,
}: {
  conversation: ConversationListItem;
  active: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (renaming) {
    return (
      <form
        ref={formRef}
        action={async (fd) => {
          const result = await renameConversationAction(fd);
          if (result.ok) {
            setRenaming(false);
            setError(null);
          } else {
            setError(result.error);
          }
        }}
        className="px-1 py-1"
      >
        <input type="hidden" name="id" value={conversation.id} />
        <input
          name="title"
          defaultValue={conversation.title}
          autoFocus
          aria-label="Rename conversation"
          onBlur={() => {
            // Submit on blur so renames aren't silently discarded.
            formRef.current?.requestSubmit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setRenaming(false);
              setError(null);
            }
          }}
          className="w-full rounded-lg border border-zt-border bg-zt-surface-2 px-2 py-1.5 text-sm text-zt-text focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
        />
        {error ? (
          <p className="mt-1 px-1 text-[11px] text-zt-danger">{error}</p>
        ) : null}
      </form>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-center rounded-lg pr-1 transition-colors",
        active ? "bg-zt-surface-2" : "hover:bg-zt-surface-2/60",
      )}
    >
      <Link
        href={`${DASHBOARD_ROUTES.aiAssistant}?c=${conversation.id}`}
        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2"
      >
        {conversation.pinned ? (
          <Pin className="size-3.5 shrink-0 text-zt-primary" aria-hidden />
        ) : null}
        <span className="truncate text-sm text-zt-text">
          {conversation.title}
        </span>
      </Link>

      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Conversation actions"
        aria-expanded={menuOpen}
        className="shrink-0 rounded-md p-1 text-zt-muted opacity-100 transition-opacity hover:text-zt-text md:opacity-0 md:group-hover:opacity-100 data-[open=true]:opacity-100"
        data-open={menuOpen}
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>

      {menuOpen ? (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-1 top-9 z-20 w-40 overflow-hidden rounded-lg border border-zt-border bg-zt-surface shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setRenaming(true);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zt-text hover:bg-zt-surface-2"
            >
              <Pencil className="size-3.5" aria-hidden />
              Rename
            </button>
            <form
              action={async (fd) => {
                await pinConversationAction(fd);
                setMenuOpen(false);
              }}
            >
              <input type="hidden" name="id" value={conversation.id} />
              <input
                type="hidden"
                name="pinned"
                value={conversation.pinned ? "" : "true"}
              />
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zt-text hover:bg-zt-surface-2"
              >
                {conversation.pinned ? (
                  <>
                    <PinOff className="size-3.5" aria-hidden />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="size-3.5" aria-hidden />
                    Pin
                  </>
                )}
              </button>
            </form>
            <form
              action={async (fd) => {
                await deleteConversationAction(fd);
                setMenuOpen(false);
              }}
            >
              <input type="hidden" name="id" value={conversation.id} />
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zt-danger hover:bg-zt-surface-2"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Delete
              </button>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
