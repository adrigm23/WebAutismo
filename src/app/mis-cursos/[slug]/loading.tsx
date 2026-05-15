function LoadingBlock(input: { className: string }) {
  return <div className={`animate-pulse rounded-[24px] bg-[var(--color-surface)] ${input.className}`} />;
}

export default function CourseCampusLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)]">
      <div className="border-b border-[rgba(12,113,195,0.14)] bg-white/95 px-6 py-5 lg:px-12">
        <LoadingBlock className="h-10 w-80" />
        <div className="mt-4 flex flex-wrap gap-3">
          <LoadingBlock className="h-10 w-28" />
          <LoadingBlock className="h-10 w-24" />
          <LoadingBlock className="h-10 w-36" />
          <LoadingBlock className="h-10 w-24" />
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-141px)] lg:grid-cols-[1fr_400px]">
        <section className="space-y-8 px-6 py-10 lg:px-12">
          <LoadingBlock className="h-[34rem] w-full" />
          <LoadingBlock className="h-10 w-64" />
          <LoadingBlock className="h-64 w-full" />
        </section>

        <aside className="border-l border-[rgba(12,113,195,0.14)] bg-white px-6 py-6">
          <div className="flex gap-2">
            <LoadingBlock className="h-16 flex-1" />
            <LoadingBlock className="h-16 flex-1" />
            <LoadingBlock className="h-16 flex-1" />
          </div>
          <div className="mt-6 space-y-4">
            <LoadingBlock className="h-40 w-full" />
            <LoadingBlock className="h-40 w-full" />
            <LoadingBlock className="h-40 w-full" />
          </div>
        </aside>
      </div>
    </div>
  );
}
