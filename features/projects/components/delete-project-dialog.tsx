"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useDictionary } from "@/components/i18n/locale-provider";
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
  const { dict } = useDictionary();
  const t = dict.dash.projects;
  const common = dict.dashboardCommon;
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
      title={t.delete.title}
      description={t.delete.body}
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
            form="delete-project-form"
            disabled={isPending}
            className="rounded-lg bg-zt-danger px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zt-danger/90 disabled:opacity-60"
          >
            {isPending ? t.delete.deleting : t.delete.confirm}
          </button>
        </>
      }
    >
      <form id="delete-project-form" action={formAction}>
        <input type="hidden" name="id" value={project?.id ?? ""} />
        <p className="text-sm text-zt-muted">
          {t.delete.confirmDetail.replace("{name}", project?.name ?? "")}
        </p>
        {state.status === "error" && state.message ? (
          <p className="mt-3 text-xs text-zt-danger">{state.message}</p>
        ) : null}
      </form>
    </Modal>
  );
}
