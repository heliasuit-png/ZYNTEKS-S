import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function StatusPagesLoading() {
  const { dict } = await getDictionary();

  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zt-surface-2" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-zt-surface-2" />
      </div>
      <div className="h-40 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      <div className="h-64 animate-pulse rounded-2xl border border-zt-border bg-zt-surface" />
      <span className="sr-only">{dict.dashboardCommon.loadingStates.statusPages}</span>
    </div>
  );
}
