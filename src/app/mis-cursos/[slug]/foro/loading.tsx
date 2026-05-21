import { Skeleton } from "@/components/ui/skeleton";

export default function ForumLoading() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Skeleton className="h-6 w-40" rounded="pill" />
      <Skeleton className="h-56 w-full" rounded="lg" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-64 w-full" rounded="lg" />
        <Skeleton className="h-64 w-full" rounded="lg" />
        <Skeleton className="h-64 w-full" rounded="lg" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" rounded="lg" />
        <Skeleton className="h-28 w-full" rounded="lg" />
      </div>
    </div>
  );
}
