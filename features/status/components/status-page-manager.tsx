"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/dashboard/badge";
import { CopyButton } from "@/components/dashboard/copy-button";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { MAINTENANCE_STATUSES } from "@/lib/constants";
import {
  addComponentAction,
  createMaintenanceAction,
  createStatusPageAction,
  deleteComponentAction,
  deleteMaintenanceAction,
  deleteStatusPageAction,
  updateMaintenanceAction,
  updateStatusPageAction,
} from "@/features/status/actions";
import { initialStatusPageFormState } from "@/features/status/types";
import type {
  StatusPage,
  StatusPageComponent,
  StatusPageMaintenance,
} from "@/services/status";

const inputClass =
  "w-full rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-text outline-none transition-colors focus:border-zt-primary";
const primaryButton =
  "rounded-lg bg-zt-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90 disabled:opacity-60";
const ghostButton =
  "rounded-lg border border-zt-border px-3 py-2 text-sm text-zt-muted transition-colors hover:text-zt-text";

interface StatusPageManagerProps {
  pages: { page: StatusPage; projectName: string }[];
  components: Record<string, StatusPageComponent[]>;
  maintenance: Record<string, StatusPageMaintenance[]>;
  availableProjects: { id: string; name: string }[];
  publicBaseUrl: string;
}

export function StatusPageManager({
  pages,
  components,
  maintenance,
  availableProjects,
  publicBaseUrl,
}: StatusPageManagerProps) {
  return (
    <div className="space-y-6">
      <CreateStatusPageForm availableProjects={availableProjects} />
      {pages.length === 0 ? null : (
        <div className="space-y-4">
          {pages.map(({ page, projectName }) => (
            <StatusPageCard
              key={page.id}
              page={page}
              projectName={projectName}
              components={components[page.id] ?? []}
              maintenance={maintenance[page.id] ?? []}
              publicBaseUrl={publicBaseUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateStatusPageForm({
  availableProjects,
}: {
  availableProjects: { id: string; name: string }[];
}) {
  const { dict } = useDictionary();
  const t = dict.dash.statusPages;
  const common = dict.dashboardCommon;
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createStatusPageAction,
    initialStatusPageFormState,
  );
  const handledRef = useRef<typeof state | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success" && handledRef.current !== state) {
      handledRef.current = state;
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>{t.create}</PanelTitle>
      </PanelHeader>
      <PanelContent>
        {availableProjects.length === 0 ? (
          <p className="text-sm text-zt-muted">
            {t.allProjectsHavePages}
          </p>
        ) : (
          <form ref={formRef} action={formAction} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zt-muted">
                  {t.project}
                </label>
                <select name="projectId" required className={inputClass}>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zt-muted">
                  {t.nameOptional}
                </label>
                <input
                  name="name"
                  className={inputClass}
                  placeholder={t.namePlaceholder}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zt-muted">
                {t.descriptionOptional}
              </label>
              <input
                name="description"
                className={inputClass}
                placeholder={t.descriptionPlaceholder}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zt-text">
              <input
                type="checkbox"
                name="isPublic"
                defaultChecked
                className="size-4 accent-zt-primary"
              />
              {t.publiclyAccessible}
            </label>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={isPending} className={primaryButton}>
                {isPending ? t.creating : t.createSubmit}
              </button>
              {state.status === "error" && state.message ? (
                <span className="text-xs text-zt-danger">{state.message}</span>
              ) : null}
            </div>
          </form>
        )}
      </PanelContent>
    </Panel>
  );
}

function StatusPageCard({
  page,
  projectName,
  components,
  maintenance,
  publicBaseUrl,
}: {
  page: StatusPage;
  projectName: string;
  components: StatusPageComponent[];
  maintenance: StatusPageMaintenance[];
  publicBaseUrl: string;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.statusPages;
  const common = dict.dashboardCommon;
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateStatusPageAction,
    initialStatusPageFormState,
  );
  const handledRef = useRef<typeof state | null>(null);
  const publicUrl = `${publicBaseUrl}/${page.slug}`;

  useEffect(() => {
    if (state.status === "success" && handledRef.current !== state) {
      handledRef.current = state;
      router.refresh();
    }
  }, [state, router]);

  return (
    <Panel>
      <PanelHeader>
        <div className="min-w-0 space-y-1">
          <PanelTitle>{projectName}</PanelTitle>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-zt-primary hover:underline"
            >
              {publicUrl}
              <ExternalLink className="size-3" aria-hidden />
            </a>
            <CopyButton value={publicUrl} label={t.copyLink} />
          </div>
        </div>
        <Badge tone={page.is_public ? "success" : "default"}>
          {page.is_public ? t.isPublic : t.isPrivate}
        </Badge>
      </PanelHeader>
      <PanelContent className="space-y-4">
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={page.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zt-muted">{t.name}</label>
              <input
                name="name"
                defaultValue={page.name}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zt-muted">
                {t.publicSlug}
              </label>
              <input
                name="slug"
                defaultValue={page.slug}
                required
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zt-muted">
              {t.description}
            </label>
            <input
              name="description"
              defaultValue={page.description ?? ""}
              className={inputClass}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zt-muted">
                {t.logoUrl}
              </label>
              <input
                name="logoUrl"
                type="url"
                defaultValue={page.logo_url ?? ""}
                className={inputClass}
                placeholder="https://"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zt-muted">
                {t.primaryColor}
              </label>
              <input
                name="brandColor"
                defaultValue={page.brand_color ?? "#3B82F6"}
                className={inputClass}
                placeholder="#3B82F6"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zt-muted">
                {t.timezone}
              </label>
              <input
                name="timezone"
                defaultValue={page.timezone ?? "UTC"}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zt-muted">
                {t.contactEmail}
              </label>
              <input
                name="contactEmail"
                type="email"
                defaultValue={page.contact_email ?? ""}
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zt-muted">{t.footer}</label>
            <input
              name="footerText"
              defaultValue={page.footer_text ?? ""}
              className={inputClass}
              placeholder={t.footerPlaceholder}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zt-text">
            <input
              type="checkbox"
              name="isPublic"
              defaultChecked={page.is_public}
              className="size-4 accent-zt-primary"
            />
            {t.publiclyAccessible}
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={isPending} className={primaryButton}>
              {isPending ? common.saving : t.saveChanges}
            </button>
            {state.status === "success" ? (
              <span className="text-xs text-zt-success">{state.message}</span>
            ) : null}
            {state.status === "error" && state.message ? (
              <span className="text-xs text-zt-danger">{state.message}</span>
            ) : null}
          </div>
        </form>

        <div className="space-y-2 border-t border-zt-border pt-4">
          <p className="text-xs font-medium text-zt-muted">{t.components}</p>
          {components.length === 0 ? (
            <p className="text-xs text-zt-muted">{t.noComponents}.</p>
          ) : (
            <ul className="space-y-1.5">
              {components.map((component) => (
                <li
                  key={component.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zt-border bg-zt-surface-2 px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-zt-text">
                      {component.name}
                    </span>
                    {component.description ? (
                      <span className="block text-xs text-zt-muted">
                        {component.description}
                      </span>
                    ) : null}
                  </span>
                  <form action={deleteComponentAction}>
                    <input type="hidden" name="id" value={component.id} />
                    <input type="hidden" name="slug" value={page.slug} />
                    <button
                      type="submit"
                      aria-label={t.deleteComponent}
                      className="rounded-lg p-1.5 text-zt-muted transition-colors hover:text-zt-danger"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form
            action={addComponentAction}
            className="flex flex-wrap items-center gap-2 pt-1"
          >
            <input type="hidden" name="statusPageId" value={page.id} />
            <input type="hidden" name="slug" value={page.slug} />
            <input
              name="name"
              required
              placeholder={t.componentName}
              className={`${inputClass} max-w-48`}
            />
            <input
              name="description"
              placeholder={t.descriptionOptional}
              className={`${inputClass} max-w-64`}
            />
            <button type="submit" className={ghostButton}>
              {t.addComponent}
            </button>
          </form>
        </div>

        <div className="space-y-2 border-t border-zt-border pt-4">
          <p className="text-xs font-medium text-zt-muted">{t.maintenance}</p>
          {maintenance.length === 0 ? (
            <p className="text-xs text-zt-muted">{t.noMaintenance}.</p>
          ) : (
            <ul className="space-y-2">
              {maintenance.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-zt-border bg-zt-surface-2 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-zt-text">{item.title}</p>
                      <p className="text-xs text-zt-muted">
                        {item.status} · {item.scheduled_start} →{" "}
                        {item.scheduled_end}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={updateMaintenanceAction} className="flex gap-1">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="slug" value={page.slug} />
                        <select
                          name="status"
                          defaultValue={item.status}
                          className="h-8 rounded-lg border border-zt-border bg-zt-surface px-2 text-xs"
                          aria-label={t.maintenance}
                        >
                          {MAINTENANCE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className={ghostButton}>
                          {t.update}
                        </button>
                      </form>
                      <form action={deleteMaintenanceAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="slug" value={page.slug} />
                        <button
                          type="submit"
                          aria-label={t.deleteMaintenance}
                          className="rounded-lg p-1.5 text-zt-muted transition-colors hover:text-zt-danger"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form action={createMaintenanceAction} className="grid gap-2 pt-1 sm:grid-cols-2">
            <input type="hidden" name="statusPageId" value={page.id} />
            <input type="hidden" name="slug" value={page.slug} />
            <input
              name="title"
              required
              placeholder={t.maintenanceTitlePlaceholder}
              className={inputClass}
            />
            <select name="status" defaultValue="scheduled" className={inputClass}>
              {MAINTENANCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input
              name="scheduledStart"
              type="datetime-local"
              required
              className={inputClass}
              aria-label={t.scheduledStart}
            />
            <input
              name="scheduledEnd"
              type="datetime-local"
              required
              className={inputClass}
              aria-label={t.scheduledEnd}
            />
            <input
              name="description"
              placeholder={t.descriptionOptional}
              className={`${inputClass} sm:col-span-2`}
            />
            <button type="submit" className={`${ghostButton} sm:col-span-2`}>
              {t.scheduleMaintenance}
            </button>
          </form>
        </div>

        <div className="flex justify-end border-t border-zt-border pt-4">
          <form action={deleteStatusPageAction}>
            <input type="hidden" name="id" value={page.id} />
            <input type="hidden" name="slug" value={page.slug} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zt-danger/40 px-3 py-2 text-sm text-zt-danger transition-colors hover:bg-zt-danger/10"
            >
              <Trash2 className="size-4" aria-hidden />
              {t.deletePage}
            </button>
          </form>
        </div>
      </PanelContent>
    </Panel>
  );
}
