"use client";

import {
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import { Dropdown, dropdownItemClass } from "@/components/dashboard/dropdown";
import { Panel } from "@/components/dashboard/panel";
import {
  PROJECT_FRAMEWORK_LABELS,
  PROJECT_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/utils/format";
import type { ProjectStatus } from "@/types/database";
import type { Project } from "@/features/projects/types";

const statusTone: Record<ProjectStatus, BadgeProps["tone"]> = {
  active: "success",
  paused: "warning",
  archived: "default",
};

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  return (
    <Panel className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zt-text">
            {project.name}
          </p>
          <p className="truncate text-xs text-zt-muted">/{project.slug}</p>
        </div>
        <Dropdown
          align="end"
          menuClassName="w-44"
          trigger={
            <span className="flex size-8 items-center justify-center rounded-lg border border-zt-border bg-zt-surface-2 text-zt-muted transition-colors hover:text-zt-text">
              <MoreVertical className="size-4" aria-hidden />
            </span>
          }
        >
          <button
            type="button"
            className={dropdownItemClass}
            onClick={() => onEdit(project)}
          >
            <Pencil className="size-4" aria-hidden />
            Edit
          </button>
          <button
            type="button"
            className={cn(dropdownItemClass, "text-zt-danger hover:text-zt-danger")}
            onClick={() => onDelete(project)}
          >
            <Trash2 className="size-4" aria-hidden />
            Delete
          </button>
        </Dropdown>
      </div>

      {project.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-zt-muted">
          {project.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="primary">
          {PROJECT_FRAMEWORK_LABELS[project.framework]}
        </Badge>
        <Badge tone={statusTone[project.status]}>
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
      </div>

      {project.production_url || project.staging_url ? (
        <div className="mt-4 space-y-1.5">
          {project.production_url ? (
            <a
              href={project.production_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-zt-muted transition-colors hover:text-zt-primary"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              <span className="truncate">{project.production_url}</span>
            </a>
          ) : null}
          {project.staging_url ? (
            <a
              href={project.staging_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-zt-muted transition-colors hover:text-zt-primary"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              <span className="truncate">{project.staging_url}</span>
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto pt-4 text-xs text-zt-muted">
        Created {formatDate(project.created_at)}
      </div>
    </Panel>
  );
}
