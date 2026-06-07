import { Skeleton } from "@/components/ui/skeleton";

export default function ThreadLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)]">
      <div className="border-b border-[rgba(12,113,195,0.14)] bg-white/95 px-6 py-5 lg:px-12">
        <Skeleton className="h-9 w-80" rounded="pill" />
      </div>

      <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
        <Skeleton className="mb-6 h-20 w-full" rounded="lg" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" rounded="lg" />
          ))}
        </div>
        <Skeleton className="mt-6 h-32 w-full" rounded="lg" />
      </main>
    </div>
  );
}
