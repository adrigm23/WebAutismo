"use client";

import type { ComponentProps } from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
};

export function Progress({
  className,
  value = 0,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value ?? 0));

  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[color:var(--color-primary-soft)]",
        className,
      )}
      value={safeValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full rounded-[inherit] bg-[var(--color-primary)] transition-transform duration-[var(--motion-duration-slow)] ease-[var(--motion-ease-standard)]",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
