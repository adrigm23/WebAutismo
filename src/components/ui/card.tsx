import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_18px_40px_rgba(34,34,33,0.06)]",
        className
      )}
      {...props}
    />
  );
}
