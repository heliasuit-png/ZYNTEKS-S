"use client";

import { Ban, RefreshCw } from "lucide-react";

import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import { Panel } from "@/components/dashboard/panel";
import { CopyButton } from "@/components/dashboard/copy-button";
import { buildMaskedKey } from "@/lib/api-key-format";
import { API_KEY_ENVIRONMENT_LABELS } from "@/lib/constants";
import { formatDate } from "@/utils/format";
import type { ApiKeyEnvironment, ApiKeyStatus } from "@/types/database";
import type { ApiKey } from "@/features/api-keys/types";

const environmentTone: Record<ApiKeyEnvironment, BadgeProps["tone"]> = {
  production: "primary",
  staging: "warning",
  development: "default",
};

const statusTone: Record<ApiKeyStatus, BadgeProps["tone"]> = {
  active: "success",
  revoked: "danger",
};

interface ApiKeyCardProps {
  apiKey: ApiKey;
  projectName: string;
  busy: boolean;
  onRevoke: (id: string) => void;
  onRegenerate: (id: string) => void;
}

export function ApiKeyCard({
  apiKey,
  projectName,
  busy,
  onRevoke,
  onRegenerate,
}: ApiKeyCardProps) {
  const isActive = apiKey.status === "active";

  return (
    <Panel className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zt-text">
            {apiKey.name}
          </p>
          <p className="truncate text-xs text-zt-muted">{projectName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={environmentTone[apiKey.environment]}>
            {API_KEY_ENVIRONMENT_LABELS[apiKey.environment]}
          </Badge>
          <Badge tone={statusTone[apiKey.status]}>{apiKey.status}</Badge>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-zt-border bg-zt-surface-2 px-3 py-2 font-mono text-xs text-zt-muted">
          {buildMaskedKey(apiKey.key_prefix)}
        </code>
        <CopyButton value={apiKey.key_prefix} label="Copy prefix" />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-zt-muted">Created</dt>
          <dd className="text-zt-text">{formatDate(apiKey.created_at)}</dd>
        </div>
        <div>
          <dt className="text-zt-muted">Last used</dt>
          <dd className="text-zt-text">
            {apiKey.last_used_at ? formatDate(apiKey.last_used_at) : "Never"}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center gap-2 pt-4">
        <button
          type="button"
          onClick={() => onRegenerate(apiKey.id)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zt-border bg-zt-surface-2 px-3 py-1.5 text-xs font-medium text-zt-text transition-colors hover:border-zt-primary/40 disabled:opacity-60"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Regenerate
        </button>
        {isActive ? (
          <button
            type="button"
            onClick={() => onRevoke(apiKey.id)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zt-danger/40 bg-zt-danger/10 px-3 py-1.5 text-xs font-medium text-zt-danger transition-colors hover:bg-zt-danger/20 disabled:opacity-60"
          >
            <Ban className="size-3.5" aria-hidden />
            Revoke
          </button>
        ) : null}
      </div>
    </Panel>
  );
}
