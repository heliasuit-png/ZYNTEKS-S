import type { NextRequest } from "next/server";

import { ok, withErrorHandling } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { DASHBOARD_ROUTES, ERROR_CODE, HTTP_STATUS } from "@/lib/constants";
import { env } from "@/lib/env";
import {
  AppError,
  BadRequestError,
  RateLimitError,
  UnauthorizedError,
} from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { loadLemonSqueezyConfig } from "@/services/billing/lemon-squeezy/config";
import {
  isLemonCheckoutPlanId,
  loadCheckoutVariantMapping,
  requireCheckoutVariantId,
  type LemonCheckoutPlanId,
} from "@/services/billing/lemon-squeezy/checkout-plans";
import { createLemonCheckout } from "@/services/billing/lemon-squeezy/api";
import { resolveActiveWorkspace } from "@/services/workspace";

export const runtime = "nodejs";

function configError(message: string): AppError {
  return new AppError(message, {
    code: ERROR_CODE.INTERNAL,
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational: true,
  });
}

/**
 * POST /api/lemonsqueezy/checkout
 *
 * Body: { plan: "developer" | "pro" | "business" }
 * - Authenticates user (401 if missing)
 * - Resolves variant ONLY from server env (never from client)
 * - Returns hosted Lemon checkout URL
 * - Does NOT grant entitlement (webhook only)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase, user } = await requireApiUser();
  if (!user.email) {
    throw new UnauthorizedError("Authenticated email is required for checkout.");
  }

  const limit = rateLimit(`lemon:checkout:${user.id}`, 20, 60_000);
  if (!limit.allowed) {
    throw new RateLimitError("Too many checkout requests. Try again shortly.");
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const planRaw =
    body && typeof body === "object" && "plan" in body
      ? (body as { plan?: unknown }).plan
      : undefined;

  if (!isLemonCheckoutPlanId(planRaw)) {
    throw new BadRequestError(
      "Invalid plan. Use developer, pro, or business.",
      { plan: ["Invalid plan"] },
    );
  }
  const plan: LemonCheckoutPlanId = planRaw;

  const config = loadLemonSqueezyConfig();
  if (config.mode === "off") {
    throw configError(
      "Lemon Squeezy checkout is disabled (LEMON_SQUEEZY_MODE=off).",
    );
  }
  if (!config.isCheckoutReady) {
    throw configError(
      config.notReadyReason ??
        "Lemon Squeezy checkout is not configured (API key / store id).",
    );
  }
  if (!config.apiKey) {
    throw configError("LEMON_SQUEEZY_API_KEY is missing.");
  }
  if (!config.storeId) {
    throw configError("LEMON_SQUEEZY_STORE_ID is missing.");
  }

  const variants = loadCheckoutVariantMapping();
  let variantId: string;
  try {
    variantId = requireCheckoutVariantId(plan, variants);
  } catch {
    throw configError(
      `Lemon Squeezy variant is not configured for plan=${plan}.`,
    );
  }

  const { active } = await resolveActiveWorkspace(
    supabase,
    user.id,
    user.email,
  );

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const successUrl = `${appUrl}${DASHBOARD_ROUTES.billing}?checkout=returned`;

  const result = await createLemonCheckout({
    config,
    variantId,
    input: {
      userId: user.id,
      workspaceId: active.id,
      email: user.email,
      plan: plan === "business" ? "enterprise" : "pro",
      interval: "month",
      successUrl,
      cancelUrl: `${appUrl}${DASHBOARD_ROUTES.billing}?checkout=canceled`,
    },
  });

  if (!result.ok || !result.checkoutUrl) {
    throw configError(result.message);
  }

  return ok({
    checkoutUrl: result.checkoutUrl,
    plan,
  });
});
