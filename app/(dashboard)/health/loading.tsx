export default function HealthLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-52 animate-pulse rounded-lg bg-zt-surface-2" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-zt-surface-2" />
      </div>
      <div className="h-10 animate-pulse rounded-xl bg-zt-surface-2" />
      <div className="h-48 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
        <div className="h-56 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
        <div className="h-64 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      </div>
      <span className="sr-only">Loading health monitoring…</span>
    </div>
  );
}
