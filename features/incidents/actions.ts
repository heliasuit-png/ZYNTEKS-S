"use server";

import { revalidatePath } from "next/cache";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  fieldErrorsFromZod,
  toLocalizedErrorMessage,
} from "@/lib/i18n/localize-action";
import { createSupabaseServerClient } from "@/supabase/server";
import { getAuthenticatedUser } from "@/services/auth";
import { addIncidentUpdate } from "@/services/incidents";
import { addIncidentUpdateSchema } from "@/features/incidents/schemas";
import type { IncidentActionState } from "@/features/incidents/types";

export async function addIncidentUpdateAction(
  _prevState: IncidentActionState,
  formData: FormData,
): Promise<IncidentActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const rawStatus = formData.get("status");
  const parsed = addIncidentUpdateSchema.safeParse({
    incidentId: formData.get("incidentId"),
    message: formData.get("message"),
    status: rawStatus ? rawStatus : undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error, am) };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { status: "error", message: am.mustSignIn };
  }

  try {
    await addIncidentUpdate(supabase, user.id, parsed.data.incidentId, {
      message: parsed.data.message,
      status: parsed.data.status,
    });
    revalidatePath(`${DASHBOARD_ROUTES.incidents}/${parsed.data.incidentId}`);
    revalidatePath(DASHBOARD_ROUTES.incidents);
    return { status: "success", message: am.updatePosted };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}
