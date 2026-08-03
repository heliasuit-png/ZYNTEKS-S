import {
  ListPanelSkeleton,
  Skeleton,
  StatCardSkeleton,
} from "@/components/dashboard/skeleton";

export default function DashboardHomeLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ListPanelSkeleton rows={5} />
        </div>
        <ListPanelSkeleton rows={4} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListPanelSkeleton />
        <ListPanelSkeleton />
      </div>
    </div>
  );
}
