import { Skeleton } from "@/components/ui/skeleton";

export default function AdminEditionsLoading() {
  return (
    <div className="space-y-9">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-36" rounded="pill" />
          <Skeleton className="h-4 w-56" rounded="pill" />
        </div>
        <Skeleton className="h-10 w-36" rounded="md" />
      </div>

      {/* Guide + 2 metrics — mirrors xl:grid-cols-[1.1fr_1fr_1fr] */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Skeleton className="h-44 w-full" rounded="lg" />
        <Skeleton className="h-24 w-full self-start" rounded="lg" />
        <Skeleton className="h-24 w-full self-start" rounded="lg" />
      </div>

      {/* Filter + list */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm" rounded="md" />
        <Skeleton className="h-10 w-32" rounded="md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" rounded="lg" />
        ))}
      </div>
    </div>
  );
}
