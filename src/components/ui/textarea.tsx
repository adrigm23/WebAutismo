import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-[1.15rem] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:bg-white focus:ring-2 focus:ring-[color:rgba(12,113,195,0.16)]",
        className
      )}
      {...props}
    />
  );
}
