import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function StatusLoading() {
  const { dict } = await getDictionary();

  return (
    <main className="min-h-screen bg-zt-bg px-4 py-16" role="status" aria-live="polite">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zt-surface-2" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-zt-surface-2" />
        <div className="h-24 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
        <div className="h-40 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      </div>
      <span className="sr-only">{dict.dashboardCommon.loadingStates.status}</span>
    </main>
  );
}
