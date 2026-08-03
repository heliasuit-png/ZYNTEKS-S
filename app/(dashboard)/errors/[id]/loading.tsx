export default function ErrorDetailLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="h-4 w-32 animate-pulse rounded bg-zt-surface-2" />
      <div className="space-y-2">
        <div className="h-8 w-3/4 max-w-xl animate-pulse rounded-lg bg-zt-surface-2" />
        <div className="h-4 w-48 animate-pulse rounded bg-zt-surface-2" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-9 w-28 animate-pulse rounded-xl bg-zt-surface-2"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      <div className="h-80 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      <span className="sr-only">Loading error details…</span>
    </div>
  );
}
