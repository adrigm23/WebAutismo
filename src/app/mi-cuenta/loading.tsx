function LoadingBlock(input: { className: string }) {
  return <div className={`animate-pulse rounded-[24px] bg-[var(--color-surface)] ${input.className}`} />;
}

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)] pb-24">
      <div className="border-b border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.92)]">
        <div className="site-container py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <LoadingBlock className="h-10 w-64" />
            <div className="flex flex-wrap gap-3">
              <LoadingBlock className="h-11 w-28" />
              <LoadingBlock className="h-11 w-32" />
              <LoadingBlock className="h-11 w-40" />
            </div>
          </div>
        </div>
      </div>

      <main className="site-container pt-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(19rem,0.8fr)]">
          <div className="space-y-6">
            <LoadingBlock className="h-8 w-48" />
            <LoadingBlock className="h-28 w-full max-w-4xl" />
            <LoadingBlock className="h-[25rem] w-full" />
          </div>
          <div className="space-y-6">
            <LoadingBlock className="h-64 w-full" />
            <LoadingBlock className="h-80 w-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
