export default function IncidentsLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zt-surface-2" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-zt-surface-2" />
      </div>
      <div className="h-10 animate-pulse rounded-xl bg-zt-surface-2" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl border border-zt-border bg-zt-surface"
          />
        ))}
      </div>
      <span className="sr-only">Loading incidents…</span>
    </div>
  );
}
