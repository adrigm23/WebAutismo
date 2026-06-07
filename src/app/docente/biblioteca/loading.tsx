import { Skeleton } from "@/components/ui/skeleton";

export default function DocenteBibliotecaLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle,#f8f7f3)]">
      <div className="border-b border-[rgba(12,113,195,0.12)] bg-white px-6 py-4 lg:px-10">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-44" rounded="pill" />
          <Skeleton className="h-10 w-36" rounded="md" />
        </div>
      </div>

      <div className="px-6 py-8 lg:px-10">
        <div className="mb-5 flex gap-3">
          <Skeleton className="h-10 max-w-xs flex-1" rounded="md" />
          <Skeleton className="h-10 w-28" rounded="md" />
          <Skeleton className="h-10 w-28" rounded="md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" rounded="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
