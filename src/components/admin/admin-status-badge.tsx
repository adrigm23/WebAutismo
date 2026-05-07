import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AdminStatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "primary" | "warning" | "danger" | "neutral";
};

const toneStyles = {
  primary: "bg-[rgba(12,113,195,0.12)] text-[var(--color-primary)]",
  warning: "bg-[rgba(255,182,6,0.22)] text-[#8c5b00]",
  danger: "bg-[rgba(204,59,47,0.12)] text-[#c43a2f]",
  neutral: "bg-[#eef2f6] text-[#56687b]"
};

export function AdminStatusBadge({
  className,
  tone = "neutral",
  ...props
}: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xl px-3 py-1 text-xs font-semibold tracking-[0.08em]",
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
