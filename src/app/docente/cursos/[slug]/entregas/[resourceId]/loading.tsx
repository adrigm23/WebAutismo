import { Skeleton } from "@/components/ui/skeleton";

export default function DocenteEntregasLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)]">
      <div className="border-b border-[rgba(12,113,195,0.14)] bg-white/95 px-6 py-5 lg:px-12">
        <Skeleton className="h-8 w-56" rounded="pill" />
        <Skeleton className="mt-2 h-4 w-40" rounded="pill" />
      </div>

      <div className="px-6 py-8 lg:px-10">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" rounded="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
