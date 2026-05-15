function LoadingBlock(input: { className: string }) {
  return <div className={`animate-pulse rounded-[24px] bg-[var(--color-surface)] ${input.className}`} />;
}

export default function ForumCategoryLoading() {
  return (
    <div className="space-y-8">
      <LoadingBlock className="h-6 w-52" />
      <LoadingBlock className="h-24 w-full max-w-4xl" />
      <div className="flex flex-wrap gap-3">
        <LoadingBlock className="h-11 w-28" />
        <LoadingBlock className="h-11 w-28" />
        <LoadingBlock className="h-11 w-32" />
        <LoadingBlock className="h-11 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <LoadingBlock className="h-28 w-full" />
        <LoadingBlock className="h-28 w-full" />
        <LoadingBlock className="h-28 w-full" />
        <LoadingBlock className="h-28 w-full" />
        <LoadingBlock className="h-28 w-full" />
      </div>
      <div className="space-y-4">
        <LoadingBlock className="h-44 w-full" />
        <LoadingBlock className="h-44 w-full" />
      </div>
    </div>
  );
}
