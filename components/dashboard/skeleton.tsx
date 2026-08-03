import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("zt-shimmer rounded-md", className)} {...props} />
  );
}

/** Skeleton shaped like a statistic card. */
export function StatCardSkeleton() {
  return (
    <div className="zt-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-9 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-8 w-16" />
      <div className="mt-2 flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

/** Skeleton shaped like a list panel. */
export function ListPanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="zt-card rounded-2xl">
      <div className="border-b border-zt-border px-5 py-4">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
