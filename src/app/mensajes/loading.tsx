import { Skeleton } from "@/components/ui/skeleton";

export default function MensajesLoading() {
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

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-72 shrink-0 border-r border-[rgba(12,113,195,0.1)] bg-white lg:block">
          <div className="p-4 border-b border-[rgba(12,113,195,0.08)]">
            <Skeleton className="h-6 w-24" rounded="pill" />
          </div>
          <div className="space-y-1 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" rounded="md" />
            ))}
          </div>
        </div>

        <main className="flex flex-1 flex-col">
          <div className="border-b border-[rgba(12,113,195,0.08)] bg-white px-6 py-4">
            <Skeleton className="h-6 w-40" rounded="pill" />
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                <Skeleton className="h-9 w-9 shrink-0" rounded="pill" />
                <Skeleton className={`h-16 ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} rounded="lg" />
              </div>
            ))}
          </div>
          <div className="border-t border-[rgba(12,113,195,0.08)] bg-white p-4">
            <Skeleton className="h-12 w-full" rounded="md" />
          </div>
        </main>
      </div>
    </div>
  );
}
