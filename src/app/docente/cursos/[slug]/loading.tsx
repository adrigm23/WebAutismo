import { Skeleton } from "@/components/ui/skeleton";

export default function DocenteCursoDetailLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)]">
      <div className="border-b border-[rgba(12,113,195,0.14)] bg-white/95 px-6 py-5 lg:px-12">
        <Skeleton className="h-10 w-72" rounded="pill" />
        <div className="mt-4 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-28" rounded="pill" />
          <Skeleton className="h-10 w-28" rounded="pill" />
          <Skeleton className="h-10 w-28" rounded="pill" />
        </div>
      </div>

      <main className="grid min-h-[calc(100vh-141px)] lg:grid-cols-[1fr_400px]">
        <section className="space-y-6 px-6 py-8 lg:px-12">
          <Skeleton className="h-[22rem] w-full" rounded="lg" />
          <Skeleton className="h-[18rem] w-full" rounded="lg" />
        </section>

        <aside className="border-l border-[rgba(12,113,195,0.14)] bg-white px-6 py-6">
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" rounded="lg" />
            <Skeleton className="h-36 w-full" rounded="lg" />
            <Skeleton className="h-36 w-full" rounded="lg" />
          </div>
        </aside>
      </main>
    </div>
  );
}
