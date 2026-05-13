export default function LoginLoading() {
  return (
    <div className="min-h-[70vh] bg-[linear-gradient(180deg,#f9f6f1_0%,#f6f8fb_52%,#fbfaf7_100%)]">
      <div className="site-container py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_28rem]">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_40px_rgba(34,34,33,0.06)]">
            <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--color-primary-soft)]" />
            <div className="mt-6 h-16 w-full max-w-[32rem] animate-pulse rounded-[1.5rem] bg-[var(--color-surface)]" />
            <div className="mt-4 h-5 w-full max-w-[28rem] animate-pulse rounded-full bg-[var(--color-surface)]" />
            <div className="mt-10 space-y-4">
              <div className="h-14 animate-pulse rounded-[1.2rem] bg-[var(--color-surface)]" />
              <div className="h-14 animate-pulse rounded-[1.2rem] bg-[var(--color-surface)]" />
              <div className="h-14 animate-pulse rounded-[1.2rem] bg-[var(--color-primary-soft)]" />
            </div>
          </div>

          <div className="hidden rounded-2xl border border-[var(--color-border)] bg-white/80 p-8 shadow-[0_18px_40px_rgba(34,34,33,0.06)] lg:block">
            <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--color-primary-soft)]" />
            <div className="mt-6 h-8 w-56 animate-pulse rounded-full bg-[var(--color-surface)]" />
            <div className="mt-4 h-24 animate-pulse rounded-[1.5rem] bg-[var(--color-surface)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
