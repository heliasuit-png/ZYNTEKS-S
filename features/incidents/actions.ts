"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/supabase/server";
import { getAuthenticatedUser } from "@/services/auth";
import { addIncidentUpdate } from "@/services/incidents";
import { addIncidentUpdateSchema } from "@/features/incidents/schemas";
import type { IncidentActionState } from "@/features/incidents/types";

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors;
  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages && messages.length > 0) {
      result[key] = messages;
    }
  }
  return result;
}

function toErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export async function addIncidentUpdateAction(
  _prevState: IncidentActionState,
  formData: FormData,
): Promise<IncidentActionState> {
  const rawStatus = formData.get("status");
  const parsed = addIncidentUpdateSchema.safeParse({
    incidentId: formData.get("incidentId"),
    message: formData.get("message"),
    status: rawStatus ? rawStatus : undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  try {
    await addIncidentUpdate(supabase, user.id, parsed.data.incidentId, {
      message: parsed.data.message,
      status: parsed.data.status,
    });
    revalidatePath(`${DASHBOARD_ROUTES.incidents}/${parsed.data.incidentId}`);
    revalidatePath(DASHBOARD_ROUTES.incidents);
    return { status: "success", message: "Update posted." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}
