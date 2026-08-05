import { NextResponse } from "next/server";

import { ROUTES } from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-redirect";
import {
  exchangeCodeForSession,
  getAuthenticatedUser,
  recordLoginEvent,
} from "@/services/auth";
import type { AuthLoginMethod } from "@/types/database";
import { createSupabaseServerClient } from "@/supabase/server";
import { createSupabaseAdminClient } from "@/supabase/admin";
import { touchSession } from "@/services/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function methodFromProvider(provider: string | undefined): AuthLoginMethod {
  switch (provider) {
    case "google":
      return "oauth_google";
    case "github":
      return "oauth_github";
    case "azure":
      return "oauth_microsoft";
    case "apple":
      return "oauth_apple";
    case "email":
      return "magic_link";
    default:
      return "unknown";
  }
}

/**
 * PKCE / email-link / OAuth callback. Exchanges the `code` returned by Supabase
 * for a session and records login telemetry.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), ROUTES.dashboard);

  if (!code) {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();

  try {
    const session = await exchangeCodeForSession(supabase, code);
    const user = await getAuthenticatedUser(supabase);
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip");
    const country = request.headers.get("x-vercel-ip-country");
    const userAgent = request.headers.get("user-agent");

    const provider =
      user?.app_metadata?.provider ??
      user?.identities?.[0]?.provider ??
      "email";

    if (user) {
      await recordLoginEvent({
        userId: user.id,
        email: user.email,
        method: methodFromProvider(
          typeof provider === "string" ? provider : undefined,
        ),
        provider: typeof provider === "string" ? provider : null,
        ipAddress: ip,
        country,
        userAgent,
        metadata: {
          identities: (user.identities ?? []).map((identity) => identity.provider),
        },
      });

      try {
        await touchSession(supabase, {
          userId: user.id,
          accessToken: session.access_token,
          userAgent,
          ipAddress: ip,
          country,
        });
      } catch {
        // Session touch is best-effort.
      }

      // Fill sparse profile fields from OAuth identity metadata (never overwrite).
      try {
        const meta = user.user_metadata ?? {};
        const fullName =
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          null;
        const avatarUrl =
          (typeof meta.avatar_url === "string" && meta.avatar_url) ||
          (typeof meta.picture === "string" && meta.picture) ||
          null;
        if (fullName || avatarUrl) {
          const admin = createSupabaseAdminClient();
          const { data: profile } = await admin
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();
          if (profile) {
            await admin
              .from("profiles")
              .update({
                full_name: profile.full_name ?? fullName,
                avatar_url: profile.avatar_url ?? avatarUrl,
              })
              .eq("id", user.id);
          }
        }
      } catch {
        // Non-blocking profile enrichment.
      }
    }
  } catch (error) {
    // TEMPORARY diagnostics — remove after OAuth callback investigation.
    console.error(error);
    console.error("[auth/callback] exchange failed", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      cause:
        error instanceof Error && "cause" in error
          ? error.cause
          : undefined,
    });
    const message =
      error instanceof Error ? error.message : String(error);
    return NextResponse.redirect(
      `${origin}${ROUTES.login}?error=${encodeURIComponent(message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
