/**
 * API key UX feedback: toast wiring + secret scrubbing.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

import {
  apiKeyActionErrorMessage,
  scrubApiKeySecrets,
} from "../../features/api-keys/lib/safe-feedback";

const explorer = readFileSync(
  resolve(
    process.cwd(),
    "features/api-keys/components/api-keys-explorer.tsx",
  ),
  "utf8",
);
const generateModal = readFileSync(
  resolve(
    process.cwd(),
    "features/api-keys/components/generate-key-modal.tsx",
  ),
  "utf8",
);
const revealModal = readFileSync(
  resolve(process.cwd(), "features/api-keys/components/reveal-key-modal.tsx"),
  "utf8",
);
const actions = readFileSync(
  resolve(process.cwd(), "features/api-keys/actions.ts"),
  "utf8",
);

describe("API key UX — safe feedback helpers", () => {
  it("scrubs plaintext ZYN-KEY values from messages", () => {
    const secret = "ZYN-KEY-AbCdEfGhIjKlMnOpQrStUvWx";
    const scrubbed = scrubApiKeySecrets(`Failed for ${secret}`);
    assert.equal(scrubbed.includes(secret), false);
    assert.match(scrubbed, /ZYN-KEY-\[REDACTED\]/);
  });

  it("maps revoke/create failures to short user messages without stack traces", () => {
    assert.equal(
      apiKeyActionErrorMessage(403),
      "You are not allowed to change this API key.",
    );
    assert.equal(apiKeyActionErrorMessage(404), "API key not found.");
    assert.equal(
      apiKeyActionErrorMessage(500),
      "Something went wrong on the server. Please try again.",
    );
    assert.equal(
      apiKeyActionErrorMessage(null),
      "Something went wrong. Please try again.",
    );

    const multiline = apiKeyActionErrorMessage(
      500,
      "Error\n    at Object.<anonymous> (/app/stack.js:1:1)",
    );
    assert.equal(multiline.includes("stack.js"), false);
    assert.equal(multiline.includes("\n"), false);
  });

  it("never returns an unredacted secret when server echoes a key", () => {
    const secret = "ZYN-KEY-ThisIsAFakeSecretValue123456";
    const message = apiKeyActionErrorMessage(400, `Invalid key ${secret}`);
    assert.equal(message.includes(secret), false);
    assert.match(message, /REDACTED/);
  });
});

describe("API key UX — explorer revoke/create feedback", () => {
  it("revoke success shows success toast and refreshes list state", () => {
    assert.match(explorer, /variant:\s*"success"/);
    assert.match(explorer, /t\.toasts\.revoked/);
    assert.match(explorer, /router\.refresh\(\)/);
    assert.match(explorer, /from "@\/components\/dashboard\/toast"/);
  });

  it("revoke failure shows error toast without logging the key", () => {
    assert.match(explorer, /t\.toasts\.revokeFailed/);
    assert.match(explorer, /variant:\s*"error"/);
    assert.match(explorer, /apiKeyActionErrorMessage/);
    assert.equal(/console\.(log|error|warn|debug)\s*\(/.test(explorer), false);
  });

  it("create key failure surfaces toast via onError", () => {
    assert.match(generateModal, /onError\?/);
    assert.match(generateModal, /onError\?\.\(state\.message\)/);
    assert.match(explorer, /t\.toasts\.createFailed/);
    assert.match(explorer, /onError=\{handleCreateError\}/);
  });

  it("regenerate/new key uses one-time reveal + copy, plaintext only from response", () => {
    assert.match(explorer, /setRevealKey\(payload\.data\.plainKey\)/);
    assert.match(explorer, /setRevealKey\(plainKey\)/);
    assert.match(revealModal, /CopyButton/);
    assert.match(revealModal, /t\.revealDesc|t\.revealWarning/);
    assert.match(explorer, /t\.toasts\.regenerated|t\.toasts\.created/);
  });

  it("server actions do not console-log plainKey", () => {
    assert.match(actions, /plainKey/);
    assert.equal(/console\.(log|error|warn|debug)\s*\(/.test(actions), false);
    assert.equal(
      /console\.(log|error|warn|debug)\s*\([\s\S]{0,80}plainKey/.test(actions),
      false,
    );
  });
});
