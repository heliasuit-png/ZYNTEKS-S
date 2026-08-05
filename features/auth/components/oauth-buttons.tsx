"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { startOAuthAction } from "@/features/auth/actions";
import type { OAuthProviderConfig } from "@/services/auth/provider-types";

const ICONS: Record<OAuthProviderConfig["key"], ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.3H12z"
      />
      <path
        fill="#34A853"
        d="M3.9 7.5l3.2 2.3C8 7.5 9.9 6.2 12 6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 8.3 2.3 5.1 4.4 3.9 7.5z"
      />
      <path
        fill="#FBBC05"
        d="M12 20.7c2.5 0 4.6-.8 6.1-2.3l-2.9-2.3c-.8.5-1.8.9-3.2.9-2.5 0-4.6-1.7-5.4-4l-3.2 2.5c1.5 3 4.5 5.2 8.6 5.2z"
      />
      <path
        fill="#4285F4"
        d="M21.1 12.1c0-.5 0-.9-.1-1.3H12v3.9h5.5c-.3 1.3-1.1 2.3-2.2 3l2.9 2.3c1.7-1.6 2.9-4 2.9-7.9z"
      />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
      <path d="M12 .5C5.7.5.6 5.6.6 11.9c0 5 3.3 9.3 7.8 10.8.6.1.8-.2.8-.6v-2.1c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.5-.3-5.2-1.3-5.2-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.2 5.7.4.3.8 1 .8 2v3c0 .4.2.7.8.6A11.4 11.4 0 0 0 23.4 12C23.4 5.6 18.3.5 12 .5z" />
    </svg>
  ),
};

interface OAuthButtonsProps {
  providers: OAuthProviderConfig[];
  redirectTo?: string;
}

export function OAuthButtons({ providers, redirectTo }: OAuthButtonsProps) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visible = providers.filter((provider) => provider.enabled);

  function onContinue(provider: OAuthProviderConfig) {
    setError(null);
    setPendingKey(provider.key);
    startTransition(async () => {
      const result = await startOAuthAction(provider.key, redirectTo);
      if (result?.status === "error") {
        setError(result.message ?? "Unable to start OAuth sign-in.");
        setPendingKey(null);
      }
    });
  }

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2" role="group" aria-label="Sign in with a provider">
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
        >
          {error}
        </p>
      ) : null}
      {visible.map((provider) => {
        const busy = isPending && pendingKey === provider.key;
        return (
          <button
            key={provider.key}
            type="button"
            disabled={isPending}
            onClick={() => onContinue(provider)}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zt-text transition hover:border-zt-primary/40 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zt-primary disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              ICONS[provider.key]
            )}
            <span>{provider.label}</span>
          </button>
        );
      })}
    </div>
  );
}
