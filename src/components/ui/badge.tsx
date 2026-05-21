import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: "sm" | "md";
  shape?: "pill" | "rounded";
};

const tones = {
  neutral: "bg-[rgba(248,245,239,0.9)] text-[var(--color-ink-soft)]",
  outline: "border border-[rgba(22,60,88,0.12)] bg-white/88 text-[var(--color-muted)]",
  info: "bg-[color:rgba(223,234,243,0.78)] text-[var(--color-primary)]",
  success: "bg-[color:rgba(228,241,235,0.72)] text-[var(--color-success)]",
  warning: "bg-[color:rgba(248,239,216,0.74)] text-[var(--color-warning)]",
  danger: "bg-[color:rgba(248,225,219,0.78)] text-[var(--color-danger)]",
  brand: "bg-[color:rgba(223,234,243,0.72)] text-[var(--color-primary)]"
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
  sm: "px-2.5 py-0.5 text-[0.68rem]",
  md: "px-2.75 py-0.5 text-[0.72rem]"
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
        "inline-flex items-center font-medium tracking-[0.01em]",
        shape === "pill" ? "rounded-[var(--radius-pill)]" : "rounded-[var(--radius-sm)]",
        sizes[size],
        resolveTone(tone),
        className
      )}
      {...props}
    />
  );
}
