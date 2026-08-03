export default function NotificationsLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-zt-surface-2" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-zt-surface-2" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-2xl border border-zt-border bg-zt-surface"
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>
      <div className="h-10 animate-pulse rounded-xl bg-zt-surface-2" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl border border-zt-border bg-zt-surface"
            style={{ animationDelay: `${index * 60}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">Loading notifications…</span>
    </div>
  );
}
