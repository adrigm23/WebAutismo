import { AuthBrand } from "@/components/auth/auth-shells";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";

export default function LoginLoading() {
  return (
    <main className="campus-calm-bg min-h-[100dvh] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.03fr)_minmax(21rem,0.97fr)] lg:gap-0">
        <SurfaceCard
          className="rounded-[var(--radius-xl)] lg:rounded-r-none lg:border-r-0"
          padding="lg"
        >
          <AuthBrand />
          <div className="mt-10 flex max-w-xl flex-col gap-5">
            <Skeleton className="h-16 w-full max-w-[24rem]" rounded="lg" />
            <Skeleton className="h-6 w-full max-w-[32rem]" rounded="pill" />
            <Skeleton className="h-6 w-full max-w-[28rem]" rounded="pill" />
            <div className="mt-4 flex flex-col gap-4">
              <Skeleton className="h-16 w-full" rounded="md" />
              <Skeleton className="h-16 w-full" rounded="md" />
              <Skeleton className="h-12 w-full" rounded="md" />
            </div>
          </div>
        </SurfaceCard>

        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-primary-strong)_100%)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:rounded-l-none lg:p-10 xl:p-12">
          <Skeleton
            className="h-7 w-36 bg-white/15"
            rounded="pill"
            shimmer={false}
          />
          <Skeleton
            className="mt-8 h-14 w-full max-w-[24rem] bg-white/15"
            rounded="lg"
            shimmer={false}
          />
          <Skeleton
            className="mt-5 h-24 w-full max-w-[30rem] bg-white/10"
            rounded="lg"
            shimmer={false}
          />
        </section>
      </div>
    </main>
  );
}
