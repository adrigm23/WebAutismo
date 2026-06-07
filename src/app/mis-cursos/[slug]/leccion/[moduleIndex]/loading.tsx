import { Skeleton } from "@/components/ui/skeleton";

export default function LeccionLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa]">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[rgba(0,0,0,0.07)] bg-white px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" rounded="md" />
          <div className="hidden items-center gap-2 lg:flex">
            <Skeleton className="h-3.5 w-24" rounded="pill" />
            <Skeleton className="h-3.5 w-3" rounded="pill" />
            <Skeleton className="h-4 w-48" rounded="pill" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="hidden h-4 w-32 lg:block" rounded="pill" />
          <Skeleton className="h-8 w-24" rounded="md" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex-1 overflow-y-auto">
          <Skeleton className="aspect-video w-full" />
          <div className="mx-auto max-w-3xl space-y-4 px-5 pt-6 lg:px-8">
            <Skeleton className="h-8 w-3/4" rounded="pill" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" rounded="pill" />
              <Skeleton className="h-4 w-16" rounded="pill" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" rounded="pill" />
              <Skeleton className="h-4 w-11/12" rounded="pill" />
              <Skeleton className="h-4 w-4/5" rounded="pill" />
            </div>
          </div>
        </main>

        <aside className="hidden w-80 shrink-0 border-l border-[rgba(0,0,0,0.07)] bg-white lg:block xl:w-[22rem]">
          <div className="border-b border-[rgba(0,0,0,0.07)] px-4 py-3">
            <Skeleton className="h-5 w-32" rounded="pill" />
          </div>
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" rounded="md" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
