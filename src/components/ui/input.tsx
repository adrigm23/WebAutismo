import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "ui-control-base h-[var(--control-height-md)] px-4 text-sm",
        className
      )}
      {...props}
    />
  );
}
