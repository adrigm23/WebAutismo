import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-36" rounded="pill" />
          <Skeleton className="h-4 w-64" rounded="pill" />
        </div>
        <Skeleton className="h-10 w-36" rounded="md" />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" rounded="lg" />
        ))}
      </div>

      {/* Activity + Incidents */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-64 w-full" rounded="lg" />
        <Skeleton className="h-64 w-full" rounded="lg" />
      </div>

      {/* Table */}
      <Skeleton className="h-56 w-full" rounded="lg" />
    </div>
  );
}
