import { Skeleton } from "@/components/ui/skeleton";

export default function AdminTeachersLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-44" rounded="pill" />
          <Skeleton className="h-4 w-56" rounded="pill" />
        </div>
        <Skeleton className="h-10 w-36" rounded="md" />
      </div>

      {/* 3 metric cards */}
      <div className="grid gap-5 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" rounded="lg" />
        ))}
      </div>

      {/* Split: teacher grid + detail */}
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_24rem]">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" rounded="lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" rounded="lg" />
      </div>
    </div>
  );
}
