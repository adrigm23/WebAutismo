import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  controlSize?: "md" | "lg";
};

export function Input({ className, controlSize = "md", ...props }: InputProps) {
  return (
    <input
      className={cn(
        "ui-control-base px-4",
        controlSize === "lg"
          ? "h-[var(--control-height-lg)] text-base"
          : "h-[var(--control-height-md)] text-sm",
        className
      )}
      {...props}
    />
  );
}
