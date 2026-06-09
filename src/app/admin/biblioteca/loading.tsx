import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBibliotecaLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44" rounded="pill" />
        <Skeleton className="h-10 w-36" rounded="md" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm" rounded="md" />
        <Skeleton className="h-10 w-28" rounded="md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" rounded="lg" />
        ))}
      </div>
    </div>
  );
}
