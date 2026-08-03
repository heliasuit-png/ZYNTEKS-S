import type { NextRequest } from "next/server";

import { created, ok, withErrorHandling } from "@/lib/api-response";
import { parseIntParam, requireApiUser } from "@/lib/api-auth";
import { RateLimitError, ValidationError } from "@/lib/errors";
import { PROJECT_STATUSES } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { createProject, listProjects } from "@/services/projects";
import { createProjectSchema } from "@/features/projects/schemas";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, user } = await requireApiUser();
  const { searchParams } = new URL(request.url);

  const statusParam = searchParams.get("status");
  const status = PROJECT_STATUSES.find((value) => value === statusParam);

  const page = await listProjects(supabase, user.id, {
    page: parseIntParam(searchParams.get("page")),
    pageSize: parseIntParam(searchParams.get("pageSize")),
    search: searchParams.get("search") ?? undefined,
    status,
  });

  return ok(page);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase, user } = await requireApiUser();
  const limit = rateLimit(`projects:create:${user.id}`, 30, 60_000);
  if (!limit.allowed) {
    throw new RateLimitError("Too many project create requests.");
  }
  const body = (await request.json().catch(() => null)) as unknown;

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      "Invalid project payload.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const project = await createProject(supabase, user.id, {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    framework: parsed.data.framework,
    productionUrl: parsed.data.productionUrl,
    stagingUrl: parsed.data.stagingUrl,
  });

  return created(project);
});
