/**
 * Structural regression: AI chat must not swap DOM trees / remount page shells
 * during streaming (insertBefore / removeChild NotFoundError).
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
const templateSrc = readFileSync(
  resolve(process.cwd(), "app/(dashboard)/template.tsx"),
  "utf8",
);

describe("AI stream DOM stability", () => {
  it("updates assistant text via textContent (Chrome Translate safe)", () => {
    assert.match(chatMessageSrc, /StablePlainText/);
    assert.match(chatMessageSrc, /el\.textContent\s*=/);
    assert.equal(
      /MarkdownMessage/.test(chatMessageSrc),
      false,
      "Live chat must not mount remark/rehype Markdown during/after stream",
    );
  });

  it("does not unmount empty state via exclusive ternary", () => {
    assert.match(workspaceSrc, /messages\.length === 0 && "hidden"/);
    assert.equal(
      /AiInfinity/.test(workspaceSrc),
      false,
      "Framer AiInfinity must stay out of the AI chat tree",
    );
  });

  it("opts the chat workspace out of browser translation", () => {
    assert.match(workspaceSrc, /translate="no"/);
    assert.match(chatMessageSrc, /translate="no"/);
  });

  it("does not router.replace or router.refresh after stream", () => {
    assert.equal(/router\.replace\(/.test(workspaceSrc), false);
    assert.equal(
      /router\.refresh\(/.test(workspaceSrc),
      false,
      "router.refresh remounts RSC and races live chat DOM",
    );
    assert.match(workspaceSrc, /history\.replaceState/);
    assert.match(workspaceSrc, /stream-complete-no-refresh|selection-skip-wipe/);
  });

  it("keeps dashboard template free of Framer Motion", () => {
    assert.equal(/framer-motion/.test(templateSrc), false);
    assert.equal(/motion\./.test(templateSrc), false);
  });
});
