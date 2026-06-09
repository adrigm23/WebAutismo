import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSupervisionLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-44" rounded="pill" />
          <Skeleton className="h-4 w-60" rounded="pill" />
        </div>
        <Skeleton className="h-10 w-32" rounded="md" />
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-52" rounded="md" />
        <Skeleton className="h-10 w-36" rounded="md" />
        <Skeleton className="h-10 w-36" rounded="md" />
        <Skeleton className="h-10 w-36" rounded="md" />
      </div>

      {/* 3 metric cards */}
      <div className="grid gap-5 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" rounded="lg" />
        ))}
      </div>

      {/* Split layout: table + detail */}
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[1.22fr_0.78fr]">
        <Skeleton className="h-80 w-full" rounded="lg" />
        <Skeleton className="h-80 w-full" rounded="lg" />
      </div>
    </div>
  );
}
