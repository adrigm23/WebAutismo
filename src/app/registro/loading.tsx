import { AuthBrand } from "@/components/auth/auth-shells";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";

export default function RegisterLoading() {
  return (
    <main className="campus-calm-bg flex min-h-[100dvh] items-center px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <AuthBrand align="center" subtitle="Plataforma profesional" />
        <SurfaceCard className="mt-8 w-full" padding="lg">
          <div className="mx-auto max-w-[34rem]">
            <div className="text-center">
              <Skeleton className="mx-auto h-4 w-32" rounded="pill" />
              <Skeleton
                className="mx-auto mt-4 h-14 w-full max-w-[24rem]"
                rounded="lg"
              />
              <Skeleton
                className="mx-auto mt-4 h-6 w-full max-w-[30rem]"
                rounded="pill"
              />
            </div>
            <div className="mt-8 flex flex-col gap-4">
              <Skeleton className="h-16 w-full" rounded="md" />
              <Skeleton className="h-16 w-full" rounded="md" />
              <Skeleton className="h-16 w-full" rounded="md" />
              <Skeleton className="h-16 w-full" rounded="md" />
              <Skeleton className="h-12 w-full" rounded="md" />
            </div>
          </div>
        </SurfaceCard>
      </div>
    </main>
  );
}
