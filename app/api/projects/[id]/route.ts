import type { NextRequest } from "next/server";

import { ok, withErrorHandling } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { ValidationError } from "@/lib/errors";
import {
  deleteProject,
  getProjectById,
  updateProject,
} from "@/services/projects";
import { updateProjectSchema } from "@/features/projects/schemas";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(
  async (_request: NextRequest, context: RouteContext) => {
    const { supabase, user } = await requireApiUser();
    const { id } = await context.params;
    const project = await getProjectById(supabase, user.id, id);
    return ok(project);
  },
);

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: RouteContext) => {
    const { supabase, user } = await requireApiUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as unknown;

    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid project payload.",
        parsed.error.flatten().fieldErrors,
      );
    }

    const project = await updateProject(supabase, user.id, id, {
      name: parsed.data.name,
      description: parsed.data.description,
      framework: parsed.data.framework,
      status: parsed.data.status,
      productionUrl: parsed.data.productionUrl,
      stagingUrl: parsed.data.stagingUrl,
    });

    return ok(project);
  },
);

export const DELETE = withErrorHandling(
  async (_request: NextRequest, context: RouteContext) => {
    const { supabase, user } = await requireApiUser();
    const { id } = await context.params;
    await deleteProject(supabase, user.id, id);
    return ok({ id });
  },
);
