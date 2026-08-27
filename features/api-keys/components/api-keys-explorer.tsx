"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Plus, Search } from "lucide-react";
import Link from "next/link";

import { useDictionary } from "@/components/i18n/locale-provider";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Pagination } from "@/components/dashboard/pagination";
import { FadeIn } from "@/components/dashboard/motion";
import { Toast } from "@/components/dashboard/toast";
import type { ToastVariant } from "@/components/dashboard/toast";
import {
  API_KEY_ENVIRONMENTS,
  API_ROUTES,
  DASHBOARD_ROUTES,
} from "@/lib/constants";
import { ApiKeyCard } from "@/features/api-keys/components/api-key-card";
import { GenerateKeyModal } from "@/features/api-keys/components/generate-key-modal";
import type { ProjectOption } from "@/features/api-keys/components/generate-key-modal";
import { RevealKeyModal } from "@/features/api-keys/components/reveal-key-modal";
import { apiKeyActionErrorMessage } from "@/features/api-keys/lib/safe-feedback";
import type { ApiKey } from "@/features/api-keys/types";

const selectClass =
  "h-9 rounded-xl border border-zt-border bg-zt-surface px-3 text-sm text-zt-text focus:outline-none focus:ring-2 focus:ring-zt-primary/40";

interface ApiKeysFilters {
  projectId: string;
  environment: string;
  status: string;
}

interface ApiKeysExplorerProps {
  apiKeys: ApiKey[];
  projects: ProjectOption[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  filters: ApiKeysFilters;
}

interface FeedbackToast {
  message: string;
  variant: ToastVariant;
  title?: string;
}

export function ApiKeysExplorer({
  apiKeys,
  projects,
  total,
  page,
  pageSize,
  search,
  filters,
}: ApiKeysExplorerProps) {
  const { dict } = useDictionary();
  const t = dict.dash.apiKeys;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(search);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<FeedbackToast | null>(null);

  const isFirstRender = useRef(true);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const projectNames = new Map(projects.map((p) => [p.id, p.name]));
  const errorCopy = t.errors;

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      if (searchValue === search) {
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue.trim()) {
        params.set("q", searchValue.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [searchValue, search, pathname, router, searchParams]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  const showToast = useCallback((next: FeedbackToast) => {
    setToast(next);
  }, []);

  const handleRevoke = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        const response = await fetch(`${API_ROUTES.apiKeys}/${id}/revoke`, {
          method: "POST",
        });
        const payload = (await response.json().catch(() => null)) as {
          success?: boolean;
          error?: { message?: string };
          message?: string;
        } | null;

        if (!response.ok || payload?.success === false) {
          showToast({
            variant: "error",
            title: t.toasts.revokeFailed,
            message: apiKeyActionErrorMessage(
              response.status,
              payload?.error?.message ?? payload?.message,
              errorCopy,
            ),
          });
          return;
        }

        showToast({
          variant: "success",
          title: t.toasts.revoked,
          message: t.toasts.revokedDesc,
        });
        router.refresh();
      } catch {
        showToast({
          variant: "error",
          title: t.toasts.revokeFailed,
          message: apiKeyActionErrorMessage(null, null, errorCopy),
        });
      } finally {
        setBusyId(null);
      }
    },
    [router, showToast, t.toasts, errorCopy],
  );

  const handleRegenerate = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        const response = await fetch(
          `${API_ROUTES.apiKeys}/${id}/regenerate`,
          { method: "POST" },
        );
        const payload = (await response.json().catch(() => null)) as {
          success?: boolean;
          data?: { plainKey?: string };
          error?: { message?: string };
          message?: string;
        } | null;

        if (!response.ok || !payload?.success || !payload.data?.plainKey) {
          showToast({
            variant: "error",
            title: t.toasts.regenerateFailed,
            message: apiKeyActionErrorMessage(
              response.status,
              payload?.error?.message ?? payload?.message,
              errorCopy,
            ),
          });
          return;
        }

        setRevealKey(payload.data.plainKey);
        showToast({
          variant: "success",
          title: t.toasts.regenerated,
          message: t.toasts.copyNewNow,
        });
        router.refresh();
      } catch {
        showToast({
          variant: "error",
          title: t.toasts.regenerateFailed,
          message: apiKeyActionErrorMessage(null, null, errorCopy),
        });
      } finally {
        setBusyId(null);
      }
    },
    [router, showToast, t.toasts, errorCopy],
  );

  const handleCreated = useCallback(
    (plainKey: string) => {
      setRevealKey(plainKey);
      showToast({
        variant: "success",
        title: t.toasts.created,
        message: t.toasts.copyNow,
      });
    },
    [showToast, t.toasts],
  );

  const handleCreateError = useCallback(
    (message: string) => {
      showToast({
        variant: "error",
        title: t.toasts.createFailed,
        message: apiKeyActionErrorMessage(null, message, errorCopy),
      });
    },
    [showToast, t.toasts.createFailed, errorCopy],
  );

  const hasProjects = projects.length > 0;
  const hasActiveFilters = Boolean(
    search || filters.projectId || filters.environment || filters.status,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zt-muted"
              aria-hidden
            />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchAria}
              className="h-9 w-full rounded-xl border border-zt-border bg-zt-surface pl-9 pr-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
            />
          </div>

          <select
            aria-label={t.filterProjectAria}
            value={filters.projectId}
            onChange={(event) => updateParam("projectId", event.target.value)}
            className={selectClass}
          >
            <option value="">{t.allProjects}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            aria-label={t.filterEnvironmentAria}
            value={filters.environment}
            onChange={(event) => updateParam("environment", event.target.value)}
            className={selectClass}
          >
            <option value="">{t.allEnvironments}</option>
            {API_KEY_ENVIRONMENTS.map((environment) => (
              <option key={environment} value={environment}>
                {t.environments[environment]}
              </option>
            ))}
          </select>

          <select
            aria-label={t.filterStatusAria}
            value={filters.status}
            onChange={(event) => updateParam("status", event.target.value)}
            className={selectClass}
          >
            <option value="">{t.allStatuses}</option>
            <option value="active">{t.statuses.active}</option>
            <option value="revoked">{t.statuses.revoked}</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setGenerateOpen(true)}
          disabled={!hasProjects}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90 disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden />
          {t.generate}
        </button>
      </div>

      {apiKeys.length === 0 ? (
        !hasProjects ? (
          <EmptyState
            icon={KeyRound}
            title={t.createProjectFirst}
            description={t.createProjectFirstDesc}
            action={
              <Link
                href={DASHBOARD_ROUTES.projects}
                className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
              >
                {t.connectionGuide.goToProjects}
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={KeyRound}
            title={hasActiveFilters ? t.noMatching : t.noKeys}
            description={
              hasActiveFilters ? t.emptyFilterDesc : t.emptyDesc
            }
            action={
              hasActiveFilters ? undefined : (
                <button
                  type="button"
                  onClick={() => setGenerateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
                >
                  <Plus className="size-4" aria-hidden />
                  {t.generate}
                </button>
              )
            }
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {apiKeys.map((apiKey, index) => (
              <FadeIn key={apiKey.id} delay={index * 0.03}>
                <ApiKeyCard
                  apiKey={apiKey}
                  projectName={
                    projectNames.get(apiKey.project_id) ?? t.projectFallback
                  }
                  busy={busyId === apiKey.id}
                  onRevoke={handleRevoke}
                  onRegenerate={handleRegenerate}
                />
              </FadeIn>
            ))}
          </div>
          {totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          ) : null}
        </>
      )}

      <GenerateKeyModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        projects={projects}
        onCreated={handleCreated}
        onError={handleCreateError}
      />
      <RevealKeyModal
        open={revealKey !== null}
        plainKey={revealKey}
        onClose={() => setRevealKey(null)}
      />
      {toast ? (
        <Toast
          message={toast.message}
          title={toast.title}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
