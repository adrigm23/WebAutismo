import { Skeleton } from "@/components/ui/skeleton";

export default function RecursosLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)]">
      <div className="border-b border-[rgba(12,113,195,0.14)] bg-white/95 px-6 py-5 lg:px-12">
        <Skeleton className="h-10 w-80" rounded="pill" />
        <div className="mt-4 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-28" rounded="pill" />
          <Skeleton className="h-10 w-24" rounded="pill" />
          <Skeleton className="h-10 w-36" rounded="pill" />
        </div>
      </div>

      <main className="space-y-6 px-6 py-8 lg:px-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" rounded="lg" />
        ))}
      </main>
    </div>
  );
}
