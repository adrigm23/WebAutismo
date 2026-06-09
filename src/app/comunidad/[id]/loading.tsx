import { Skeleton } from "@/components/ui/skeleton";

export default function ComunidadThreadLoading() {
  return (
    <div className="flex min-h-screen bg-[#f8f7f3]">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 shrink-0 border-r border-[rgba(12,113,195,0.1)] bg-white lg:block">
        <div className="p-5">
          <Skeleton className="h-8 w-32" rounded="md" />
        </div>
        <div className="mt-6 space-y-1.5 px-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" rounded="md" />
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        {/* Back link */}
        <Skeleton className="mb-6 h-5 w-32" rounded="pill" />

        {/* Thread header */}
        <div className="mb-6 space-y-3">
          <Skeleton className="h-8 w-3/4" rounded="pill" />
          <div className="flex gap-3">
            <Skeleton className="h-5 w-24" rounded="pill" />
            <Skeleton className="h-5 w-32" rounded="pill" />
          </div>
        </div>

        {/* Thread body */}
        <Skeleton className="mb-6 h-40 w-full" rounded="lg" />

        {/* Replies */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" rounded="lg" />
          ))}
        </div>
      </main>
    </div>
  );
}
