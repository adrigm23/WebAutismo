import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: "sm" | "md";
  shape?: "pill" | "rounded";
};

const tones = {
  neutral: "bg-[var(--color-surface)] text-[var(--color-ink)]",
  outline: "border border-[var(--color-border)] bg-white text-[var(--color-muted)]",
  info: "bg-[color:var(--color-brand-soft)] text-[var(--color-primary)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  brand: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
} as const;

const legacyToneMap = {
  default: "neutral",
  teacher: "info",
  student: "warning",
  muted: "outline",
  accent: "warning"
} as const;

export type BadgeTone =
  | keyof typeof tones
  | keyof typeof legacyToneMap;

const sizes = {
  sm: "px-2.5 py-1 text-[0.72rem]",
  md: "px-3 py-1 text-xs"
} as const;

function resolveTone(tone: BadgeTone) {
  return tone in legacyToneMap
    ? tones[legacyToneMap[tone as keyof typeof legacyToneMap]]
    : tones[tone as keyof typeof tones];
}

export function Badge({
  className,
  tone = "default",
  size = "md",
  shape = "pill",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold",
        shape === "pill" ? "rounded-[var(--radius-pill)]" : "rounded-[var(--radius-sm)]",
        sizes[size],
        resolveTone(tone),
        className
      )}
      {...props}
    />
  );
}
