import { Skeleton } from "@/components/ui/skeleton";

export default function RevisionLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle,#f8f7f3)]">
      <div className="border-b border-[rgba(12,113,195,0.12)] bg-white px-6 py-4 lg:px-10">
        <Skeleton className="h-8 w-48" rounded="pill" />
      </div>

      <div className="px-6 py-8 lg:px-10">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" rounded="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
