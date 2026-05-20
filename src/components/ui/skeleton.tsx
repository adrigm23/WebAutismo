import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  rounded?: "sm" | "md" | "lg" | "pill" | "full";
  shimmer?: boolean;
};

export function Skeleton({
  className,
  rounded = "md",
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-[var(--color-surface)]",
        shimmer && "animate-pulse",
        rounded === "sm" && "rounded-[var(--radius-sm)]",
        rounded === "md" && "rounded-[var(--radius-md)]",
        rounded === "lg" && "rounded-[var(--radius-lg)]",
        rounded === "pill" && "rounded-[var(--radius-pill)]",
        rounded === "full" && "rounded-full",
        className
      )}
      {...props}
    />
  );
}
