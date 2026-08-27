import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { dictionaries } from "@/lib/i18n/dictionaries";
import { completeEmailLinkAuth } from "@/services/auth/complete-email-link";

const root = process.cwd();

function read(path: string) {
  return readFileSync(`${root}/${path}`, "utf8");
}

describe("registration signup response handling", () => {
  it("treats session=null as verification success, not authError", () => {
    const actions = read("features/auth/actions.ts");
    const service = read("services/auth/auth.service.ts");
    assert.match(service, /requiresEmailVerification/);
    assert.match(service, /isDuplicatePlaceholder/);
    assert.match(actions, /accountCreatedVerify/);
    assert.match(actions, /accountCreatedSignIn/);
    assert.match(actions, /accountExistsCheckEmail/);
    // Must not surface login authError dictionary key from signup action
    assert.doesNotMatch(actions, /dict\.auth\.authError/);
    assert.doesNotMatch(actions, /login\?error=/);
  });

  it("does not map null session after signUp to authentication failure copy", () => {
    const en = dictionaries.en;
    assert.notEqual(en.actionMessages.auth.accountCreatedVerify, en.auth.authError);
    assert.match(en.actionMessages.auth.accountCreatedVerify, /verify|inbox/i);
    assert.match(en.actionMessages.auth.accountCreatedSignIn, /sign in/i);
    assert.match(
      en.auth.authErrorFailed,
      /sign in with your email and password/i,
    );
    assert.match(
      dictionaries.tr.auth.authErrorFailed,
      /giriş yapın/i,
    );
  });

  it("email link completer accepts token_hash without requiring PKCE code", async () => {
    const src = read("services/auth/complete-email-link.ts");
    assert.match(src, /token_hash/);
    assert.match(src, /verifyEmailOtp|verifyOtp/);
    assert.match(src, /exchangeCodeForSession/);

    // Structural: missing both params → missing_code (no network)
    const result = await completeEmailLinkAuth(
      {
        auth: {
          exchangeCodeForSession: async () => {
            throw new Error("should not be called");
          },
          verifyOtp: async () => {
            throw new Error("should not be called");
          },
        },
      } as never,
      new URLSearchParams(),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "missing_code");
    }
  });

  it("callback and confirm routes both use completeEmailLinkAuth", () => {
    const callback = read("app/auth/callback/route.ts");
    const confirm = read("app/auth/confirm/route.ts");
    assert.match(callback, /completeEmailLinkAuth/);
    assert.match(confirm, /completeEmailLinkAuth/);
  });

  it("signup redirect targets auth/confirm for email links", () => {
    const actions = read("features/auth/actions.ts");
    assert.match(actions, /AUTH_ROUTES\.confirm/);
    assert.match(actions, /emailRedirectTo/);
  });
});
