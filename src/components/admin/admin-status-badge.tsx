import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AdminStatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "primary" | "warning" | "danger" | "neutral";
};

const toneStyles = {
  primary:
    "border-[color:color-mix(in_srgb,var(--color-primary-soft)_85%,white)] bg-[color:color-mix(in_srgb,var(--color-primary-soft)_78%,white)] text-[var(--color-primary)]",
  warning:
    "border-[color:color-mix(in_srgb,var(--color-accent-soft)_88%,white)] bg-[color:color-mix(in_srgb,var(--color-accent-soft)_80%,white)] text-[var(--color-warning)]",
  danger:
    "border-[color:color-mix(in_srgb,var(--color-danger-soft)_86%,white)] bg-[color:color-mix(in_srgb,var(--color-danger-soft)_78%,white)] text-[var(--color-danger)]",
  neutral:
    "border-[color:color-mix(in_srgb,var(--color-border)_76%,white)] bg-[color:color-mix(in_srgb,var(--color-surface-soft)_58%,white)] text-[var(--color-ink-soft)]"
};

export function AdminStatusBadge({
  className,
  tone = "neutral",
  ...props
}: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-pill)] border px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em]",
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
