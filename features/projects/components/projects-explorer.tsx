"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FolderKanban, Plus, Search } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Pagination } from "@/components/dashboard/pagination";
import { FadeIn } from "@/components/dashboard/motion";
import { Toast } from "@/components/dashboard/toast";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectFormModal } from "@/features/projects/components/project-form-modal";
import { DeleteProjectDialog } from "@/features/projects/components/delete-project-dialog";
import type { Project } from "@/features/projects/types";

interface ProjectsExplorerProps {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
}

export function ProjectsExplorer({
  projects,
  total,
  page,
  pageSize,
  search,
}: ProjectsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isFirstRender = useRef(true);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zt-muted"
            aria-hidden
          />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            className="h-9 w-full rounded-xl border border-zt-border bg-zt-surface pl-9 pr-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
          />
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
        >
          <Plus className="size-4" aria-hidden />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={search ? "No matching projects" : "No projects yet"}
          description={
            search
              ? `No projects match “${search}”. Try a different search.`
              : "Create your first project to start building with ZYNTEKSIS."
          }
          action={
            search ? undefined : (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
              >
                <Plus className="size-4" aria-hidden />
                New Project
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => (
              <FadeIn key={project.id} delay={index * 0.03}>
                <ProjectCard
                  project={project}
                  onEdit={setEditing}
                  onDelete={setDeleting}
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

      <ProjectFormModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(message) => setToast(message)}
      />
      <ProjectFormModal
        mode="edit"
        open={editing !== null}
        project={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSuccess={(message) => setToast(message)}
      />
      <DeleteProjectDialog
        open={deleting !== null}
        project={deleting}
        onClose={() => setDeleting(null)}
      />

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}
