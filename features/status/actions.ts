"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DASHBOARD_ROUTES, STATUS_PAGE_BASE_PATH } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/supabase/server";
import { getAuthenticatedUser } from "@/services/auth";
import {
  addStatusPageComponent,
  createMaintenance,
  createStatusPage,
  deleteMaintenance,
  deleteStatusPage,
  deleteStatusPageComponent,
  updateMaintenance,
  updateStatusPage,
} from "@/services/status";
import {
  addComponentSchema,
  createMaintenanceSchema,
  createStatusPageSchema,
  updateMaintenanceSchema,
  updateStatusPageSchema,
} from "@/features/status/schemas";
import type { StatusPageFormState } from "@/features/status/types";

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
  if (isAppError(error)) return error.message;
  return "Something went wrong. Please try again.";
}

function checkbox(formData: FormData, name: string): boolean {
  const value = formData.get(name);
  return value === "on" || value === "true";
}

async function resolveUser() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  return { supabase, user };
}

function revalidateStatus(slug?: string) {
  revalidatePath(DASHBOARD_ROUTES.statusPages);
  revalidatePath(STATUS_PAGE_BASE_PATH);
  if (slug) {
    revalidatePath(`${STATUS_PAGE_BASE_PATH}/${slug}`);
  }
}

export async function createStatusPageAction(
  _prevState: StatusPageFormState,
  formData: FormData,
): Promise<StatusPageFormState> {
  const parsed = createStatusPageSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    isPublic: checkbox(formData, "isPublic"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const { supabase, user } = await resolveUser();
  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  try {
    const page = await createStatusPage(supabase, user.id, {
      projectId: parsed.data.projectId,
      name: parsed.data.name || undefined,
      slug: parsed.data.slug || undefined,
      description: parsed.data.description || null,
      isPublic: parsed.data.isPublic,
    });
    revalidateStatus(page.slug);
    return { status: "success", message: "Status page created." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function updateStatusPageAction(
  _prevState: StatusPageFormState,
  formData: FormData,
): Promise<StatusPageFormState> {
  const parsed = updateStatusPageSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    isPublic: checkbox(formData, "isPublic"),
    logoUrl: formData.get("logoUrl") ?? "",
    brandColor: formData.get("brandColor") ?? "",
    timezone: formData.get("timezone") ?? "",
    contactEmail: formData.get("contactEmail") ?? "",
    footerText: formData.get("footerText") ?? "",
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const { supabase, user } = await resolveUser();
  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  try {
    const page = await updateStatusPage(supabase, user.id, parsed.data.id, {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      isPublic: parsed.data.isPublic,
      logoUrl: parsed.data.logoUrl || null,
      brandColor: parsed.data.brandColor || undefined,
      timezone: parsed.data.timezone || undefined,
      contactEmail: parsed.data.contactEmail || null,
      footerText: parsed.data.footerText || null,
    });
    revalidateStatus(page.slug);
    return { status: "success", message: "Status page updated." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function deleteStatusPageAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!id) return;
  const { supabase, user } = await resolveUser();
  if (!user) return;
  await deleteStatusPage(supabase, user.id, id);
  revalidateStatus(slug || undefined);
}

export async function addComponentAction(formData: FormData): Promise<void> {
  const parsed = addComponentSchema.safeParse({
    statusPageId: formData.get("statusPageId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return;
  const { supabase, user } = await resolveUser();
  if (!user) return;
  await addStatusPageComponent(supabase, user.id, {
    statusPageId: parsed.data.statusPageId,
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  revalidateStatus(String(formData.get("slug") ?? "") || undefined);
}

export async function deleteComponentAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase, user } = await resolveUser();
  if (!user) return;
  await deleteStatusPageComponent(supabase, user.id, id);
  revalidateStatus(String(formData.get("slug") ?? "") || undefined);
}

export async function createMaintenanceAction(
  formData: FormData,
): Promise<void> {
  const parsed = createMaintenanceSchema.safeParse({
    statusPageId: formData.get("statusPageId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    status: formData.get("status") ?? "scheduled",
    scheduledStart: formData.get("scheduledStart"),
    scheduledEnd: formData.get("scheduledEnd"),
  });
  if (!parsed.success) return;
  const { supabase, user } = await resolveUser();
  if (!user) return;
  await createMaintenance(supabase, user.id, {
    statusPageId: parsed.data.statusPageId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    status: parsed.data.status,
    scheduledStart: new Date(parsed.data.scheduledStart).toISOString(),
    scheduledEnd: new Date(parsed.data.scheduledEnd).toISOString(),
  });
  revalidateStatus(String(formData.get("slug") ?? "") || undefined);
}

export async function updateMaintenanceAction(
  formData: FormData,
): Promise<void> {
  const parsed = updateMaintenanceSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;
  const { supabase, user } = await resolveUser();
  if (!user) return;
  await updateMaintenance(supabase, user.id, parsed.data.id, {
    status: parsed.data.status,
  });
  revalidateStatus(String(formData.get("slug") ?? "") || undefined);
}

export async function deleteMaintenanceAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase, user } = await resolveUser();
  if (!user) return;
  await deleteMaintenance(supabase, user.id, id);
  revalidateStatus(String(formData.get("slug") ?? "") || undefined);
}
