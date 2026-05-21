import { Skeleton } from "@/components/ui/skeleton";

export default function MyCoursesLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#faf7f2_0%,#f5f7fa_48%,#fbf9f5_100%)] pb-20">
      <div className="border-b border-[rgba(12,113,195,0.14)] bg-[rgba(255,255,255,0.92)]">
        <div className="site-container py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Skeleton className="h-10 w-52" rounded="pill" />
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-11 w-28" rounded="pill" />
                <Skeleton className="h-11 w-28" rounded="pill" />
                <Skeleton className="h-11 w-24" rounded="pill" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-28" rounded="pill" />
              <Skeleton className="h-10 w-32" rounded="pill" />
            </div>
          </div>
        </div>
      </div>

      <main className="site-container pt-8">
        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="space-y-6">
            <Skeleton className="h-8 w-40" rounded="pill" />
            <Skeleton className="h-24 w-full max-w-3xl" rounded="lg" />
            <Skeleton className="h-56 w-full" rounded="lg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <Skeleton className="h-28 w-full" rounded="lg" />
            <Skeleton className="h-28 w-full" rounded="lg" />
            <Skeleton className="h-28 w-full" rounded="lg" />
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[28rem] w-full" rounded="lg" />
          <Skeleton className="h-[28rem] w-full" rounded="lg" />
        </section>
      </main>
    </div>
  );
}
