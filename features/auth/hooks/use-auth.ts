"use client";

import { useEffect, useMemo, useState } from "react";

import type { Session, User } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/supabase/client";

export interface UseAuthResult {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Client-side authentication state. Hydrates from the current session and keeps
 * itself in sync with Supabase auth events (sign in, sign out, token refresh).
 */
export function useAuth(): UseAuthResult {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user: session?.user ?? null,
    session,
    isLoading,
    isAuthenticated: session !== null,
  };
}
