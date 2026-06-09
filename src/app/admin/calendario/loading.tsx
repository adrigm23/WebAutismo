import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCalendarioLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" rounded="pill" />
        <Skeleton className="h-10 w-36" rounded="md" />
      </div>
      <Skeleton className="h-[480px] w-full" rounded="lg" />
    </div>
  );
}
