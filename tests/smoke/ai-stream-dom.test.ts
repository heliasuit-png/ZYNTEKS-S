/**
 * Structural regression: assistant bubble must not swap DOM node types
 * when the first stream delta arrives (empty streaming → content streaming).
 *
 * That sibling swap is what triggers:
 *   NotFoundError: Failed to execute 'insertBefore' on 'Node'
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

const chatMessageSrc = readFileSync(
  resolve(process.cwd(), "features/ai/components/chat-message.tsx"),
  "utf8",
);
const workspaceSrc = readFileSync(
  resolve(process.cwd(), "features/ai/components/ai-workspace.tsx"),
  "utf8",
);
const markdownSrc = readFileSync(
  resolve(process.cwd(), "components/markdown/markdown-message.tsx"),
  "utf8",
);

describe("AI stream DOM stability", () => {
  it("does not conditionally mount Thinking <p> vs MarkdownMessage as alternate children", () => {
    // Forbidden pattern from the pre-fix that caused first-delta insertBefore.
    assert.equal(
      /streaming && !message\.content \?[\s\S]*?<p[\s\S]*?Thinking/.test(
        chatMessageSrc,
      ),
      false,
      "Thinking must not be a conditional sibling that unmounts when content arrives",
    );
  });

  it("keeps a single streaming text surface (no Markdown mount while streaming)", () => {
    assert.match(
      chatMessageSrc,
      /message\.streaming \?[\s\S]*?whitespace-pre-wrap[\s\S]*?MarkdownMessage/,
    );
    assert.equal(
      /streaming=\{Boolean\(message\.streaming\)\}/.test(chatMessageSrc),
      false,
      "Must not mount MarkdownMessage during streaming",
    );
    // MarkdownMessage still supports streaming plain mode for other callers.
    assert.match(markdownSrc, /if \(streaming\)/);
  });

  it("does not unmount AiInfinity via exclusive empty/messages ternary", () => {
    // Empty state and message list must both be able to stay mounted (CSS hide).
    assert.match(workspaceSrc, /messages\.length === 0 && "hidden"/);
    assert.match(workspaceSrc, /AiInfinity/);
  });

  it("opts the assistant bubble out of browser translation", () => {
    assert.match(chatMessageSrc, /translate=\{?"no"?\}|translate="no"/);
  });
});
