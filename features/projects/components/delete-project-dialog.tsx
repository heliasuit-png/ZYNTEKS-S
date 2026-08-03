"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/dashboard/modal";
import { deleteProjectAction } from "@/features/projects/actions";
import { initialProjectActionState } from "@/features/projects/types";
import type { Project } from "@/features/projects/types";

interface DeleteProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
}

export function DeleteProjectDialog({
  open,
  onClose,
  project,
}: DeleteProjectDialogProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    deleteProjectAction,
    initialProjectActionState,
  );
  const handledRef = useRef<typeof state | null>(null);

  useEffect(() => {
    if (state.status === "success" && handledRef.current !== state) {
      handledRef.current = state;
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete project"
      description="This permanently deletes the project and all of its API keys."
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
            form="delete-project-form"
            disabled={isPending}
            className="rounded-lg bg-zt-danger px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zt-danger/90 disabled:opacity-60"
          >
            {isPending ? "Deleting…" : "Delete project"}
          </button>
        </>
      }
    >
      <form id="delete-project-form" action={formAction}>
        <input type="hidden" name="id" value={project?.id ?? ""} />
        <p className="text-sm text-zt-muted">
          Are you sure you want to delete{" "}
          <span className="font-medium text-zt-text">{project?.name}</span>?
          This action cannot be undone.
        </p>
        {state.status === "error" && state.message ? (
          <p className="mt-3 text-xs text-zt-danger">{state.message}</p>
        ) : null}
      </form>
    </Modal>
  );
}
