import type { ReactNode } from "react";
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
  warning: "before:bg-[#9b6900]",
  danger: "before:bg-[#cc3b2f]",
  neutral: "before:bg-[#d0d8e2]"
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
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.9rem] border border-[#cfd8e2] bg-white px-7 py-6 shadow-[0_16px_36px_rgba(15,44,76,0.05)] before:absolute before:inset-y-0 before:left-0 before:w-1",
        accentStyles[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#314255]">{label}</p>
        {icon ? <div className="text-[var(--color-primary)]">{icon}</div> : null}
      </div>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <p className="text-[3.3rem] font-semibold leading-none tracking-[-0.08em] text-[var(--color-ink)]">
          {value}
        </p>
        {meta ? <div className="text-right text-[1rem] leading-7 text-[#384b60]">{meta}</div> : null}
      </div>
    </div>
  );
}
