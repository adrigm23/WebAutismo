import { Skeleton } from "@/components/ui/skeleton";

export default function ForumHistoricoLoading() {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Back link */}
      <Skeleton className="h-5 w-36" rounded="pill" />

      {/* Section header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-52" rounded="pill" />
        <Skeleton className="h-4 w-72" rounded="pill" />
      </div>

      {/* Archived space rows */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[rgba(12,113,195,0.08)] bg-white/80 px-5 py-4"
          >
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" rounded="pill" />
              <Skeleton className="h-3 w-32" rounded="pill" />
            </div>
            <Skeleton className="h-6 w-20" rounded="pill" />
            <Skeleton className="h-8 w-24" rounded="md" />
          </div>
        ))}
      </div>
    </div>
  );
}
