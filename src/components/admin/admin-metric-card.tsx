import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";

type AdminMetricCardProps = {
  label: string;
  value: string | number;
  meta?: ReactNode;
  accent?: "primary" | "warning" | "danger" | "neutral";
  icon?: ReactNode;
  className?: string;
};

const accentStyles = {
  primary: "before:bg-[var(--color-primary)]",
  warning: "before:bg-[var(--color-warning)]",
  danger: "before:bg-[var(--color-danger)]",
  neutral: "before:bg-[var(--color-border-strong)]"
};

export function AdminMetricCard({
  label,
  value,
  meta,
  icon,
  accent = "primary",
  className
}: AdminMetricCardProps) {
  return (
    <SurfaceCard
      className={cn(
        "relative min-h-[11.5rem] overflow-hidden border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] before:absolute before:inset-y-0 before:left-0 before:w-1",
        accentStyles[accent],
        className
      )}
      padding="md"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-meta-xs font-semibold text-[var(--color-ink)]">{label}</p>
        {icon ? <div className="text-[var(--color-ink-soft)]">{icon}</div> : null}
      </div>
      <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
        <p className="font-premium text-[3.2rem] font-semibold leading-none tracking-[-0.08em] text-[var(--color-ink)] sm:text-[3.45rem]">
          {value}
        </p>
        {meta ? (
          <div className="max-w-[16rem] text-right text-sm leading-7 text-[var(--color-muted)]">
            {meta}
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
