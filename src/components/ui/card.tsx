import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.96)] shadow-[var(--shadow-soft)] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
