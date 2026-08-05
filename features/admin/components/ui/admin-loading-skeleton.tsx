import { AdminContainer } from "@/features/admin/components/admin-container";

/** Shared loading skeleton used by every admin route `loading.tsx`. */
export function AdminLoadingSkeleton({
  label = "Loading admin module",
}: {
  label?: string;
}) {
  return (
    <AdminContainer>
      <div className="space-y-5" aria-busy="true" aria-label={label}>
        <div className="space-y-2">
          <div className="admin-skeleton h-3 w-28 !rounded-md" />
          <div className="admin-skeleton h-8 w-64 !rounded-lg" />
          <div className="admin-skeleton h-4 w-96 max-w-full !rounded-md" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="admin-skeleton h-20" />
          ))}
        </div>
        <div className="admin-skeleton h-28" />
        <div className="admin-skeleton h-96" />
      </div>
    </AdminContainer>
  );
}
