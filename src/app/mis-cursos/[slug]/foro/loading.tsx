function LoadingBlock(input: { className: string }) {
  return <div className={`animate-pulse rounded-[24px] bg-[var(--color-surface)] ${input.className}`} />;
}

export default function ForumLoading() {
  return (
    <div className="space-y-8">
      <LoadingBlock className="h-6 w-40" />
      <LoadingBlock className="h-20 w-full max-w-4xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LoadingBlock className="h-36 w-full" />
        <LoadingBlock className="h-36 w-full" />
        <LoadingBlock className="h-36 w-full" />
        <LoadingBlock className="h-36 w-full" />
      </div>
      <div className="space-y-4">
        <LoadingBlock className="h-40 w-full" />
        <LoadingBlock className="h-40 w-full" />
        <LoadingBlock className="h-40 w-full" />
      </div>
    </div>
  );
}
