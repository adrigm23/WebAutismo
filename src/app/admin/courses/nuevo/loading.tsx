import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCourseNuevoLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" rounded="pill" />
      <Skeleton className="h-[480px] w-full max-w-2xl" rounded="lg" />
    </div>
  );
}
