import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export interface SupabaseSessionResult {
  response: NextResponse;
  user: User | null;
}

/**
 * Refreshes the Supabase auth session on every matched request and forwards the
 * updated cookies to both the browser and downstream server components. This is
 * the canonical @supabase/ssr middleware pattern. The validated user is
 * returned so callers can enforce route protection.
 */
export async function updateSupabaseSession(
  request: NextRequest,
): Promise<SupabaseSessionResult> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[],
        ) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touching the user refreshes an expired session and rotates cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
