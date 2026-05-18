import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const tones = {
  neutral: "bg-[var(--color-surface)] text-[var(--color-ink)]",
  outline: "border border-[var(--color-border)] bg-white text-[var(--color-muted)]",
  info: "bg-[rgba(12,113,195,0.1)] text-[var(--color-primary)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning: "bg-[rgba(255,182,6,0.18)] text-[#8c5b00]",
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

function resolveTone(tone: BadgeTone) {
  return tone in legacyToneMap
    ? tones[legacyToneMap[tone as keyof typeof legacyToneMap]]
    : tones[tone as keyof typeof tones];
}

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold",
        resolveTone(tone),
        className
      )}
      {...props}
    />
  );
}
