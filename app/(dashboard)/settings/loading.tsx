export default function SettingsLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zt-surface-2" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-zt-surface-2" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-2xl border border-zt-border bg-zt-surface"
            style={{ animationDelay: `${index * 40}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}
