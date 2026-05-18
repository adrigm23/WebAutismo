import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[26px] border border-[rgba(12,113,195,0.1)] bg-[rgba(255,255,255,0.94)] shadow-[0_18px_42px_-30px_rgba(21,35,50,0.18)] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
