"use client";

import type { ComponentProps } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer inline-flex size-5 shrink-0 items-center justify-center rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[color:var(--color-surface-elevated)] text-[var(--color-text-inverse)] shadow-[var(--shadow-inset-soft)] outline-none transition-[border-color,background-color,box-shadow,transform] duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] data-[state=checked]:border-[var(--color-primary)] data-[state=checked]:bg-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 active:scale-[0.98]",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="size-3.5" strokeWidth={2.4} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
