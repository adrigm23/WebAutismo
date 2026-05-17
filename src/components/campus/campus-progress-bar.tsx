type CampusProgressBarProps = {
  completedModules: number;
  totalModules: number;
  completionRate: number;
  nextModuleLabel?: string | null;
};

export function CampusProgressBar({
  completedModules,
  totalModules,
  completionRate,
  nextModuleLabel
}: CampusProgressBarProps) {
  const percent = Math.round(completionRate);

  return (
    <div className="rounded-xl border border-[rgba(12,113,195,0.12)] bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--color-muted)]">Tu progreso</p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)] tabular-nums">
            Módulo {completedModules} de {totalModules} revisados
          </p>
        </div>
        <p className="text-2xl font-semibold tracking-[-0.04em] text-[var(--color-primary)] tabular-nums">
          {percent}%
        </p>
      </div>
      <div
        aria-hidden
        className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]"
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      {nextModuleLabel ? (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Siguiente paso: <span className="font-medium text-[var(--color-ink)]">{nextModuleLabel}</span>
        </p>
      ) : null}
    </div>
  );
}
