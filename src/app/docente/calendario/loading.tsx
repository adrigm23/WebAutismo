import { Skeleton } from "@/components/ui/skeleton";

export default function DocenteCalendarioLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle,#f8f7f3)]">
      <div className="border-b border-[rgba(12,113,195,0.12)] bg-white px-6 py-4 lg:px-10">
        <Skeleton className="h-8 w-40" rounded="pill" />
      </div>

      <div className="px-6 py-8 lg:px-10">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-7 w-40" rounded="pill" />
          <Skeleton className="h-10 w-32" rounded="md" />
        </div>
        <div className="mb-4 flex gap-2">
          <Skeleton className="h-9 w-24" rounded="md" />
          <Skeleton className="h-9 w-24" rounded="md" />
          <Skeleton className="h-9 w-24" rounded="md" />
        </div>
        <Skeleton className="h-[600px] w-full" rounded="lg" />
      </div>
    </div>
  );
}
