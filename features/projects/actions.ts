"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/supabase/server";
import { getAuthenticatedUser } from "@/services/auth";
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/services/projects";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/features/projects/schemas";
import type {
  ProjectActionState,
  ProjectFormState,
} from "@/features/projects/types";

const idSchema = z.string().uuid("Invalid project id.");

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

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? undefined,
    description: formData.get("description") ?? undefined,
    framework: formData.get("framework"),
    productionUrl: formData.get("productionUrl") ?? undefined,
    stagingUrl: formData.get("stagingUrl") ?? undefined,
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
    const project = await createProject(supabase, user.id, {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      framework: parsed.data.framework,
      productionUrl: parsed.data.productionUrl,
      stagingUrl: parsed.data.stagingUrl,
    });
    revalidatePath(DASHBOARD_ROUTES.projects);
    return { status: "success", message: "Project created.", project };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function updateProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const idResult = idSchema.safeParse(formData.get("id"));
  if (!idResult.success) {
    return { status: "error", message: "Invalid project id." };
  }

  const parsed = updateProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    framework: formData.get("framework"),
    status: formData.get("status"),
    productionUrl: formData.get("productionUrl") ?? undefined,
    stagingUrl: formData.get("stagingUrl") ?? undefined,
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
    const project = await updateProject(supabase, user.id, idResult.data, {
      name: parsed.data.name,
      description: parsed.data.description,
      framework: parsed.data.framework,
      status: parsed.data.status,
      productionUrl: parsed.data.productionUrl,
      stagingUrl: parsed.data.stagingUrl,
    });
    revalidatePath(DASHBOARD_ROUTES.projects);
    return { status: "success", message: "Project updated.", project };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function deleteProjectAction(
  _prevState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const idResult = idSchema.safeParse(formData.get("id"));
  if (!idResult.success) {
    return { status: "error", message: "Invalid project id." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  try {
    await deleteProject(supabase, user.id, idResult.data);
    revalidatePath(DASHBOARD_ROUTES.projects);
    return { status: "success", message: "Project deleted." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}
