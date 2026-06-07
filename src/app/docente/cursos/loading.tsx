import { Skeleton } from "@/components/ui/skeleton";

export default function DocenteCursosLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle,#f8f7f3)]">
      <div className="border-b border-[rgba(12,113,195,0.12)] bg-white px-6 py-4 lg:px-10">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" rounded="pill" />
          <Skeleton className="h-7 w-20" rounded="md" />
        </div>
      </div>

      <div className="px-6 py-8 lg:px-10">
        <Skeleton className="mb-3 h-8 w-36" rounded="pill" />
        <Skeleton className="mb-8 h-4 w-56" rounded="pill" />

        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" rounded="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
