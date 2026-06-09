import { Skeleton } from "@/components/ui/skeleton";

export default function ForumModeracionLoading() {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48" rounded="pill" />
          <Skeleton className="h-4 w-64" rounded="pill" />
        </div>
        <Skeleton className="h-6 w-20" rounded="pill" />
      </div>

      {/* Report rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-[rgba(12,113,195,0.08)] bg-white/80 p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16" rounded="pill" />
              <Skeleton className="h-4 w-48" rounded="pill" />
              <Skeleton className="h-4 w-24 ml-auto" rounded="pill" />
            </div>
            <Skeleton className="h-4 w-full" rounded="pill" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" rounded="md" />
              <Skeleton className="h-8 w-24" rounded="md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
