import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
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
    <Card
      className={cn(
        "relative overflow-hidden border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-6 py-6 shadow-[var(--shadow-soft)] before:absolute before:inset-y-0 before:left-0 before:w-1",
        accentStyles[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-label-sm font-semibold text-[var(--color-muted)]">{label}</p>
        {icon ? <div className="text-[var(--color-primary)]">{icon}</div> : null}
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
        <p className="font-premium text-[3rem] font-semibold leading-none tracking-[-0.08em] text-[var(--color-ink)]">
          {value}
        </p>
        {meta ? <div className="text-right text-body-sm leading-7 text-[var(--color-ink-soft)]">{meta}</div> : null}
      </div>
    </Card>
  );
}
