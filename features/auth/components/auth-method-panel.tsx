"use client";

import { useState } from "react";

import { LoginForm } from "@/features/auth/components/login-form";
import { MagicLinkForm } from "@/features/auth/components/magic-link-form";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { RegisterForm } from "@/features/auth/components/register-form";
import type { OAuthProviderConfig } from "@/services/auth/provider-types";

type Mode = "password" | "magic";

interface AuthMethodPanelProps {
  variant: "login" | "register";
  providers: OAuthProviderConfig[];
  redirectTo?: string;
}

export function AuthMethodPanel({
  variant,
  providers,
  redirectTo,
}: AuthMethodPanelProps) {
  const [mode, setMode] = useState<Mode>("password");
  const hasOAuth = providers.some((provider) => provider.enabled);

  return (
    <div className="space-y-5">
      <OAuthButtons providers={providers} redirectTo={redirectTo} />

      {hasOAuth ? (
        <div className="relative flex items-center gap-3" aria-hidden>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zt-muted">
            or
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      ) : null}

      <div
        className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/20 p-1"
        role="tablist"
        aria-label="Email authentication method"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "password"}
          onClick={() => setMode("password")}
          className={`rounded-lg px-3 py-2 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zt-primary ${
            mode === "password"
              ? "bg-white/10 text-zt-text"
              : "text-zt-muted hover:text-zt-text"
          }`}
        >
          {variant === "login" ? "Password" : "Email & password"}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "magic"}
          onClick={() => setMode("magic")}
          className={`rounded-lg px-3 py-2 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zt-primary ${
            mode === "magic"
              ? "bg-white/10 text-zt-text"
              : "text-zt-muted hover:text-zt-text"
          }`}
        >
          Magic link
        </button>
      </div>

      {mode === "password" ? (
        variant === "login" ? (
          <LoginForm redirectTo={redirectTo} />
        ) : (
          <RegisterForm />
        )
      ) : (
        <MagicLinkForm redirectTo={redirectTo} />
      )}
    </div>
  );
}
