"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  fieldErrorsFromZod,
  toLocalizedErrorMessage,
} from "@/lib/i18n/localize-action";
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

const idSchema = z.string().uuid("invalid_project_id");

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? undefined,
    description: formData.get("description") ?? undefined,
    framework: formData.get("framework"),
    productionUrl: formData.get("productionUrl") ?? undefined,
    stagingUrl: formData.get("stagingUrl") ?? undefined,
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
    const project = await createProject(supabase, user.id, {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      framework: parsed.data.framework,
      productionUrl: parsed.data.productionUrl,
      stagingUrl: parsed.data.stagingUrl,
    });
    revalidatePath(DASHBOARD_ROUTES.projects);
    return { status: "success", message: am.projectCreated, project };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export async function updateProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const idResult = idSchema.safeParse(formData.get("id"));
  if (!idResult.success) {
    return { status: "error", message: am.invalidProjectId };
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
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error, am) };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { status: "error", message: am.mustSignIn };
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
    return { status: "success", message: am.projectUpdated, project };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export async function deleteProjectAction(
  _prevState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const idResult = idSchema.safeParse(formData.get("id"));
  if (!idResult.success) {
    return { status: "error", message: am.invalidProjectId };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { status: "error", message: am.mustSignIn };
  }

  try {
    await deleteProject(supabase, user.id, idResult.data);
    revalidatePath(DASHBOARD_ROUTES.projects);
    return { status: "success", message: am.projectDeleted };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}
