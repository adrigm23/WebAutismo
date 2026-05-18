function LoadingBlock(input: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-lg)] border border-[rgba(12,113,195,0.08)] bg-white/80 ${input.className}`}
    />
  );
}

export default function ForumLoading() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <LoadingBlock className="h-6 w-40" />
      <LoadingBlock className="h-56 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <LoadingBlock className="h-64 w-full" />
        <LoadingBlock className="h-64 w-full" />
        <LoadingBlock className="h-64 w-full" />
      </div>
      <div className="space-y-4">
        <LoadingBlock className="h-28 w-full" />
        <LoadingBlock className="h-28 w-full" />
      </div>
    </div>
  );
}
