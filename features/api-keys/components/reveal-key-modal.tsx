"use client";

import { AlertTriangle } from "lucide-react";

import { Modal } from "@/components/dashboard/modal";
import { CopyButton } from "@/components/dashboard/copy-button";

interface RevealKeyModalProps {
  open: boolean;
  onClose: () => void;
  plainKey: string | null;
}

export function RevealKeyModal({
  open,
  onClose,
  plainKey,
}: RevealKeyModalProps) {
  return (
    <Modal
      open={open && plainKey !== null}
      onClose={onClose}
      title="Your new API key"
      description="Copy this key now — for your security it will never be shown again."
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-zt-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
        >
          Done
        </button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-zt-warning/30 bg-zt-warning/10 px-3 py-2 text-xs text-zt-warning">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Store this key somewhere safe. You won&apos;t be able to view it again.
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-zt-border bg-zt-surface-2 px-3 py-2 font-mono text-sm text-zt-text">
            {plainKey}
          </code>
          <CopyButton value={plainKey ?? ""} />
        </div>
      </div>
    </Modal>
  );
}
