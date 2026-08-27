import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function DashboardLoading() {
  const { dict } = await getDictionary();

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center"
    >
      <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      <span className="sr-only">{dict.dashboardCommon.loadingStates.generic}</span>
    </div>
  );
}
