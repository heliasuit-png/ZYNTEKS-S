export default function IncidentDetailLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="h-4 w-32 animate-pulse rounded bg-zt-surface-2" />
      <div className="h-8 w-2/3 max-w-xl animate-pulse rounded-lg bg-zt-surface-2" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-9 w-28 animate-pulse rounded-xl bg-zt-surface-2"
          />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
        <div className="h-64 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      </div>
      <span className="sr-only">Loading incident…</span>
    </div>
  );
}
