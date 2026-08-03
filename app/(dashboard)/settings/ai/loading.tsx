export default function AiSettingsLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zt-surface-2" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-zt-surface-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-zt-border bg-zt-surface"
          />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      <span className="sr-only">Loading AI settings…</span>
    </div>
  );
}
