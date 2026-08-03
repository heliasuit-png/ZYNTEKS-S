export default function BillingLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-zt-surface-2" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-zt-surface-2" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-8 w-20 animate-pulse rounded-lg bg-zt-surface-2"
          />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      <div className="h-56 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      <span className="sr-only">Loading billing…</span>
    </div>
  );
}
