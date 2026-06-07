import { Skeleton } from "@/components/ui/skeleton";

export default function ConstructorLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)]">
      <div className="border-b border-[rgba(12,113,195,0.14)] bg-white/95 px-6 py-5 lg:px-12">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" rounded="pill" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24" rounded="md" />
            <Skeleton className="h-9 w-28" rounded="md" />
          </div>
        </div>
      </div>

      <main className="grid min-h-[calc(100vh-81px)] lg:grid-cols-[1fr_380px]">
        <section className="space-y-5 px-6 py-8 lg:px-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" rounded="lg" />
          ))}
          <Skeleton className="h-12 w-48" rounded="md" />
        </section>

        <aside className="border-l border-[rgba(12,113,195,0.14)] bg-white px-6 py-6">
          <Skeleton className="mb-4 h-6 w-32" rounded="pill" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" rounded="lg" />
            <Skeleton className="h-32 w-full" rounded="lg" />
            <Skeleton className="h-32 w-full" rounded="lg" />
          </div>
        </aside>
      </main>
    </div>
  );
}
