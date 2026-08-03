import type { NextRequest } from "next/server";

import { AI } from "@/lib/constants";
import { fail } from "@/lib/api-response";
import { RateLimitError, ValidationError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { requireApiUser } from "@/lib/api-auth";
import { getSubscriptionPlan } from "@/services/account/plan.service";
import { createNdjsonStream, handleChat } from "@/services/ai";
import { assertWithinUsageLimit } from "@/services/ai";
import { chatRequestSchema } from "@/features/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let context;
  try {
    context = await requireApiUser();

    const limit = rateLimit(
      `ai:chat:${context.user.id}`,
      AI.rateLimit.max,
      AI.rateLimit.windowMs,
    );
    if (!limit.allowed) {
      throw new RateLimitError("Too many requests. Please slow down.");
    }

    const json = await request.json().catch(() => null);
    const parsed = chatRequestSchema.safeParse(json ?? {});
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid request.",
        parsed.error.flatten().fieldErrors,
      );
    }

    const plan = await getSubscriptionPlan(context.supabase, context.user.id);
    await assertWithinUsageLimit(context.supabase, context.user.id, plan);

    const { conversationId, projectId, message, regenerate } = parsed.data;

    const stream = createNdjsonStream((emit) =>
      handleChat(
        {
          supabase: context!.supabase,
          userId: context!.user.id,
          plan,
          conversationId: conversationId ?? null,
          projectId: projectId ?? null,
          message,
          regenerate,
          signal: request.signal,
        },
        emit,
      ),
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
