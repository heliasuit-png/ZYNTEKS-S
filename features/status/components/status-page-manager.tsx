"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";

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
        <PanelTitle>Create a status page</PanelTitle>
      </PanelHeader>
      <PanelContent>
        {availableProjects.length === 0 ? (
          <p className="text-sm text-zt-muted">
            Every project already has a status page.
          </p>
        ) : (
          <form ref={formRef} action={formAction} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zt-muted">
                  Project
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
                  Name (optional)
                </label>
                <input name="name" className={inputClass} placeholder="Status" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zt-muted">
                Description (optional)
              </label>
              <input
                name="description"
                className={inputClass}
                placeholder="Public description shown on the status page"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zt-text">
              <input
                type="checkbox"
                name="isPublic"
                defaultChecked
                className="size-4 accent-zt-primary"
              />
              Publicly accessible
            </label>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={isPending} className={primaryButton}>
                {isPending ? "Creating…" : "Create status page"}
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
            <CopyButton value={publicUrl} label="Copy link" />
          </div>
        </div>
        <Badge tone={page.is_public ? "success" : "default"}>
          {page.is_public ? "Public" : "Private"}
        </Badge>
      </PanelHeader>
      <PanelContent className="space-y-4">
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={page.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zt-muted">Name</label>
              <input
                name="name"
                defaultValue={page.name}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zt-muted">
                Public URL slug
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
              Description
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
                Logo URL
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
                Primary color
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
                Timezone
              </label>
              <input
                name="timezone"
                defaultValue={page.timezone ?? "UTC"}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zt-muted">
                Contact email
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
            <label className="text-xs font-medium text-zt-muted">Footer</label>
            <input
              name="footerText"
              defaultValue={page.footer_text ?? ""}
              className={inputClass}
              placeholder="Custom footer text"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zt-text">
            <input
              type="checkbox"
              name="isPublic"
              defaultChecked={page.is_public}
              className="size-4 accent-zt-primary"
            />
            Publicly accessible
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={isPending} className={primaryButton}>
              {isPending ? "Saving…" : "Save changes"}
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
          <p className="text-xs font-medium text-zt-muted">Components</p>
          {components.length === 0 ? (
            <p className="text-xs text-zt-muted">No components yet.</p>
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
                      aria-label="Delete component"
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
              placeholder="Component name"
              className={`${inputClass} max-w-48`}
            />
            <input
              name="description"
              placeholder="Description (optional)"
              className={`${inputClass} max-w-64`}
            />
            <button type="submit" className={ghostButton}>
              Add
            </button>
          </form>
        </div>

        <div className="space-y-2 border-t border-zt-border pt-4">
          <p className="text-xs font-medium text-zt-muted">Maintenance</p>
          {maintenance.length === 0 ? (
            <p className="text-xs text-zt-muted">No maintenance windows.</p>
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
                          aria-label="Maintenance status"
                        >
                          {MAINTENANCE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className={ghostButton}>
                          Update
                        </button>
                      </form>
                      <form action={deleteMaintenanceAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="slug" value={page.slug} />
                        <button
                          type="submit"
                          aria-label="Delete maintenance"
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
              placeholder="Maintenance title"
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
              aria-label="Scheduled start"
            />
            <input
              name="scheduledEnd"
              type="datetime-local"
              required
              className={inputClass}
              aria-label="Scheduled end"
            />
            <input
              name="description"
              placeholder="Description (optional)"
              className={`${inputClass} sm:col-span-2`}
            />
            <button type="submit" className={`${ghostButton} sm:col-span-2`}>
              Schedule maintenance
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
              Delete status page
            </button>
          </form>
        </div>
      </PanelContent>
    </Panel>
  );
}
