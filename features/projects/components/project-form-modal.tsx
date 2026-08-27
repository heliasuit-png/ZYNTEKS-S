"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useDictionary } from "@/components/i18n/locale-provider";
import { Modal } from "@/components/dashboard/modal";
import {
  PROJECT_FRAMEWORKS,
  PROJECT_FRAMEWORK_LABELS,
  PROJECT_STATUSES,
} from "@/lib/constants";
import {
  createProjectAction,
  updateProjectAction,
} from "@/features/projects/actions";
import { initialProjectFormState } from "@/features/projects/types";
import type { Project } from "@/features/projects/types";

const fieldLabel = "text-sm font-medium text-zt-text";
const fieldInput =
  "h-9 w-full rounded-lg border border-zt-border bg-zt-surface-2 px-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40";
const fieldError = "text-xs text-zt-danger";

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  project?: Project;
  onSuccess?: (message: string) => void;
}

export function ProjectFormModal({
  open,
  onClose,
  mode,
  project,
  onSuccess,
}: ProjectFormModalProps) {
  const { dict } = useDictionary();
  const t = dict.dash.projects;
  const common = dict.dashboardCommon;
  const router = useRouter();
  const action = mode === "create" ? createProjectAction : updateProjectAction;
  const [state, formAction, isPending] = useActionState(
    action,
    initialProjectFormState,
  );
  const handledRef = useRef<typeof state | null>(null);

  useEffect(() => {
    if (state.status === "success" && handledRef.current !== state) {
      handledRef.current = state;
      router.refresh();
      onSuccess?.(
        mode === "create" ? t.toasts.created : t.toasts.updated,
      );
      onClose();
    }
  }, [state, router, onClose, onSuccess, mode, t.toasts.created, t.toasts.updated]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? t.form.createTitle : t.form.editTitle}
      description={
        mode === "create" ? t.form.createDesc : t.form.editDesc
      }
      className="max-w-xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zt-border px-3 py-1.5 text-sm text-zt-muted transition-colors hover:text-zt-text"
          >
            {common.cancel}
          </button>
          <button
            type="submit"
            form="project-form"
            disabled={isPending}
            className="rounded-lg bg-zt-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90 disabled:opacity-60"
          >
            {isPending
              ? t.form.saving
              : mode === "create"
                ? t.form.createSubmit
                : t.form.saveChanges}
          </button>
        </>
      }
    >
      <form id="project-form" action={formAction} className="space-y-4">
        {mode === "edit" && project ? (
          <input type="hidden" name="id" value={project.id} />
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="project-name" className={fieldLabel}>
            {t.form.name}
          </label>
          <input
            id="project-name"
            name="name"
            required
            defaultValue={project?.name ?? ""}
            placeholder={t.form.namePlaceholder}
            className={fieldInput}
          />
          {fieldErrors.name?.[0] ? (
            <p className={fieldError}>{fieldErrors.name[0]}</p>
          ) : null}
        </div>

        {mode === "create" ? (
          <div className="space-y-1.5">
            <label htmlFor="project-slug" className={fieldLabel}>
              {t.form.slug}{" "}
              <span className="text-zt-muted">{t.form.optional}</span>
            </label>
            <input
              id="project-slug"
              name="slug"
              placeholder={t.form.slugPlaceholder}
              className={fieldInput}
            />
            {fieldErrors.slug?.[0] ? (
              <p className={fieldError}>{fieldErrors.slug[0]}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1.5">
            <span className={fieldLabel}>{t.form.slug}</span>
            <p className="rounded-lg border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-muted">
              {project?.slug}
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="project-description" className={fieldLabel}>
            {t.form.description}
          </label>
          <textarea
            id="project-description"
            name="description"
            rows={3}
            defaultValue={project?.description ?? ""}
            placeholder={t.form.descriptionPlaceholder}
            className="w-full rounded-lg border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
          />
          {fieldErrors.description?.[0] ? (
            <p className={fieldError}>{fieldErrors.description[0]}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="project-framework" className={fieldLabel}>
              {t.form.framework}
            </label>
            <select
              id="project-framework"
              name="framework"
              defaultValue={project?.framework ?? "nextjs"}
              className={fieldInput}
            >
              {PROJECT_FRAMEWORKS.map((framework) => (
                <option key={framework} value={framework}>
                  {PROJECT_FRAMEWORK_LABELS[framework]}
                </option>
              ))}
            </select>
          </div>

          {mode === "edit" ? (
            <div className="space-y-1.5">
              <label htmlFor="project-status" className={fieldLabel}>
                {t.form.status}
              </label>
              <select
                id="project-status"
                name="status"
                defaultValue={project?.status ?? "active"}
                className={fieldInput}
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t.statuses[status]}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="project-production-url" className={fieldLabel}>
              {t.form.productionUrl}
            </label>
            <input
              id="project-production-url"
              name="productionUrl"
              type="url"
              defaultValue={project?.production_url ?? ""}
              placeholder={t.form.productionUrlPlaceholder}
              className={fieldInput}
            />
            {fieldErrors.productionUrl?.[0] ? (
              <p className={fieldError}>{fieldErrors.productionUrl[0]}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="project-staging-url" className={fieldLabel}>
              {t.form.stagingUrl}
            </label>
            <input
              id="project-staging-url"
              name="stagingUrl"
              type="url"
              defaultValue={project?.staging_url ?? ""}
              placeholder={t.form.stagingUrlPlaceholder}
              className={fieldInput}
            />
            {fieldErrors.stagingUrl?.[0] ? (
              <p className={fieldError}>{fieldErrors.stagingUrl[0]}</p>
            ) : null}
          </div>
        </div>

        {state.status === "error" && state.message ? (
          <p className={fieldError}>{state.message}</p>
        ) : null}
      </form>
    </Modal>
  );
}
