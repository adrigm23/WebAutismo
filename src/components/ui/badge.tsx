import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "teacher" | "student" | "muted" | "accent";
};

const tones = {
  default: "bg-[var(--color-surface)] text-[var(--color-ink)]",
  teacher: "bg-[rgba(12,113,195,0.1)] text-[var(--color-primary)]",
  student: "bg-[rgba(255,182,6,0.18)] text-[#8c5b00]",
  muted: "border border-[var(--color-border)] bg-white text-[var(--color-muted)]",
  accent: "bg-[rgba(255,182,6,0.22)] text-[#8c5b00]"
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
