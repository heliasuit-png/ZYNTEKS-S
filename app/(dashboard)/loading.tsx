export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center"
    >
      <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
