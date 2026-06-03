function LoadingBlock(input: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-[var(--color-surface)] ${input.className}`} />;
}

export default function CategoryNewThreadLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <LoadingBlock className="h-40 w-full" />
        <LoadingBlock className="h-80 w-full" />
      </div>
      <div className="space-y-6">
        <LoadingBlock className="h-80 w-full" />
        <LoadingBlock className="h-40 w-full" />
      </div>
    </div>
  );
}
