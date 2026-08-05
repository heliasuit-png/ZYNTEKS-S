interface AdminEmptyStateProps {
  title: string;
  description?: string;
}

/** Shared empty-state panel for tables and lists. */
export function AdminEmptyState({ title, description }: AdminEmptyStateProps) {
  return (
    <div
      className="admin-glass rounded-2xl px-6 py-16 text-center"
      role="status"
    >
      <p className="text-sm font-medium text-[var(--admin-text)]">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-[var(--admin-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
