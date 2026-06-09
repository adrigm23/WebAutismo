import { Skeleton } from "@/components/ui/skeleton";

export default function DocenteDashboardLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)]">
      {/* Header bar */}
      <div className="border-b border-[rgba(12,113,195,0.14)] bg-white/95 px-6 py-5 lg:px-12">
        <Skeleton className="h-7 w-48" rounded="pill" />
      </div>

      <div className="px-6 py-8 lg:px-10">
        {/* Welcome */}
        <Skeleton className="h-9 w-56" rounded="pill" />
        <Skeleton className="mt-2 h-5 w-80" rounded="pill" />

        {/* Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" rounded="lg" />
          ))}
        </div>

        {/* Course cards */}
        <div className="mt-10">
          <Skeleton className="mb-5 h-7 w-28" rounded="pill" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" rounded="lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
