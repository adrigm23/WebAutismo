import { Skeleton } from "@/components/ui/skeleton";

export default function NotificacionesLoading() {
  return (
    <div className="flex min-h-screen bg-[#f8f7f3]">
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

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <Skeleton className="mb-6 h-8 w-48" rounded="pill" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" rounded="lg" />
          ))}
        </div>
      </main>
    </div>
  );
}
