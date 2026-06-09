import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44" rounded="pill" />
        <Skeleton className="h-10 w-36" rounded="md" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-56" rounded="md" />
        <Skeleton className="h-10 w-32" rounded="md" />
        <Skeleton className="h-10 w-32" rounded="md" />
      </div>
      <div className="overflow-hidden rounded-xl border border-[rgba(12,113,195,0.12)] bg-white">
        <div className="border-b border-[rgba(12,113,195,0.08)] px-5 py-4">
          <Skeleton className="h-5 w-32" rounded="pill" />
        </div>
        <div className="divide-y divide-[rgba(12,113,195,0.06)]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="flex items-center gap-4 px-5 py-3.5" key={i}>
              <Skeleton className="h-9 w-9 shrink-0" rounded="pill" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36" rounded="pill" />
                <Skeleton className="h-3 w-48" rounded="pill" />
              </div>
              <Skeleton className="h-6 w-20" rounded="pill" />
              <Skeleton className="h-8 w-16" rounded="md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
