import { Skeleton } from "@/components/ui/skeleton";

export default function DocenteNuevoRecursoLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)]">
      <div className="border-b border-[rgba(12,113,195,0.14)] bg-white/95 px-6 py-5 lg:px-12">
        <Skeleton className="h-8 w-48" rounded="pill" />
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="space-y-5">
          <Skeleton className="h-12 w-full" rounded="lg" />
          <Skeleton className="h-12 w-full" rounded="lg" />
          <Skeleton className="h-32 w-full" rounded="lg" />
          <Skeleton className="h-12 w-full" rounded="lg" />
          <Skeleton className="h-10 w-32" rounded="md" />
        </div>
      </div>
    </div>
  );
}
