import { Skeleton } from "@/components/ui/skeleton";

export default function ThreadLoading() {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Back link */}
      <Skeleton className="h-5 w-36" rounded="pill" />

      {/* Thread header card */}
      <div className="rounded-[var(--radius-lg)] border border-[rgba(12,113,195,0.08)] bg-white/80 p-6 space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 shrink-0" rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" rounded="pill" />
            <Skeleton className="h-4 w-40" rounded="pill" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" rounded="pill" />
        <Skeleton className="h-4 w-5/6" rounded="pill" />
        <Skeleton className="h-4 w-2/3" rounded="pill" />
      </div>

      {/* Reply form */}
      <Skeleton className="h-28 w-full" rounded="lg" />

      {/* Replies */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-[rgba(12,113,195,0.08)] bg-white/80 p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0" rounded="full" />
              <Skeleton className="h-4 w-32" rounded="pill" />
              <Skeleton className="h-4 w-20 ml-auto" rounded="pill" />
            </div>
            <Skeleton className="h-4 w-full" rounded="pill" />
            <Skeleton className="h-4 w-4/5" rounded="pill" />
          </div>
        ))}
      </div>
    </div>
  );
}
