"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/dashboard/modal";
import {
  API_KEY_ENVIRONMENTS,
  API_KEY_ENVIRONMENT_LABELS,
} from "@/lib/constants";
import { createApiKeyAction } from "@/features/api-keys/actions";
import { initialApiKeyFormState } from "@/features/api-keys/types";

const fieldLabel = "text-sm font-medium text-zt-text";
const fieldInput =
  "h-9 w-full rounded-lg border border-zt-border bg-zt-surface-2 px-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40";
const fieldError = "text-xs text-zt-danger";

export interface ProjectOption {
  id: string;
  name: string;
}

interface GenerateKeyModalProps {
  open: boolean;
  onClose: () => void;
  projects: ProjectOption[];
  onCreated: (plainKey: string) => void;
}

export function GenerateKeyModal({
  open,
  onClose,
  projects,
  onCreated,
}: GenerateKeyModalProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createApiKeyAction,
    initialApiKeyFormState,
  );
  const handledRef = useRef<typeof state | null>(null);

  useEffect(() => {
    if (
      state.status === "success" &&
      state.plainKey &&
      handledRef.current !== state
    ) {
      handledRef.current = state;
      onCreated(state.plainKey);
      router.refresh();
      onClose();
    }
  }, [state, onCreated, router, onClose]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate API key"
      description="Create a new key to authenticate requests for a project."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zt-border px-3 py-1.5 text-sm text-zt-muted transition-colors hover:text-zt-text"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="generate-key-form"
            disabled={isPending || projects.length === 0}
            className="rounded-lg bg-zt-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90 disabled:opacity-60"
          >
            {isPending ? "Generating…" : "Generate key"}
          </button>
        </>
      }
    >
      {projects.length === 0 ? (
        <p className="text-sm text-zt-muted">
          Create a project before generating API keys.
        </p>
      ) : (
        <form id="generate-key-form" action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="api-key-name" className={fieldLabel}>
              Name
            </label>
            <input
              id="api-key-name"
              name="name"
              required
              placeholder="Server key"
              className={fieldInput}
            />
            {fieldErrors.name?.[0] ? (
              <p className={fieldError}>{fieldErrors.name[0]}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="api-key-project" className={fieldLabel}>
              Project
            </label>
            <select
              id="api-key-project"
              name="projectId"
              defaultValue={projects[0]?.id ?? ""}
              className={fieldInput}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {fieldErrors.projectId?.[0] ? (
              <p className={fieldError}>{fieldErrors.projectId[0]}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="api-key-environment" className={fieldLabel}>
              Environment
            </label>
            <select
              id="api-key-environment"
              name="environment"
              defaultValue="development"
              className={fieldInput}
            >
              {API_KEY_ENVIRONMENTS.map((environment) => (
                <option key={environment} value={environment}>
                  {API_KEY_ENVIRONMENT_LABELS[environment]}
                </option>
              ))}
            </select>
          </div>

          {state.status === "error" && state.message ? (
            <p className={fieldError}>{state.message}</p>
          ) : null}
        </form>
      )}
    </Modal>
  );
}
