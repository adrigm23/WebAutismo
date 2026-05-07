import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-ink)] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(12,113,195,0.18)]",
        className
      )}
      {...props}
    />
  );
}
