"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function AiComposer() {
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) {
          return;
        }
        // Integration point: send the prompt to the AI service (see ai/client).
        setNotice("Connect the AI service to start receiving responses.");
      }}
    >
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ask the assistant anything…"
          aria-label="Message the assistant"
          className="h-10 flex-1 rounded-xl border border-zt-border bg-zt-surface-2 px-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
        />
        <button
          type="submit"
          className="flex h-10 items-center gap-2 rounded-xl bg-zt-primary px-4 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
        >
          <Send className="size-4" aria-hidden />
          Send
        </button>
      </div>
      {notice ? <p className="text-xs text-zt-warning">{notice}</p> : null}
    </form>
  );
}
