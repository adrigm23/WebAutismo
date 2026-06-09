import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAuditLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-40" rounded="pill" />
          <Skeleton className="h-4 w-60" rounded="pill" />
        </div>
        <Skeleton className="h-10 w-32" rounded="md" />
      </div>

      {/* Filters: search + 4 selects */}
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.3fr)_220px_220px_220px_220px]">
        <Skeleton className="h-10 w-full" rounded="md" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" rounded="md" />
        ))}
      </div>

      {/* Split: log table + detail */}
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1.25fr)_420px]">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(12,113,195,0.12)] bg-white">
          <div className="border-b border-[rgba(12,113,195,0.08)] px-5 py-4">
            <Skeleton className="h-5 w-28" rounded="pill" />
          </div>
          <div className="divide-y divide-[rgba(12,113,195,0.06)]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="flex items-center gap-4 px-5 py-3" key={i}>
                <Skeleton className="h-8 w-8 shrink-0" rounded="pill" />
                <Skeleton className="h-4 w-36" rounded="pill" />
                <Skeleton className="h-4 flex-1" rounded="pill" />
                <Skeleton className="h-5 w-20" rounded="pill" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-72 w-full" rounded="lg" />
      </div>
    </div>
  );
}
