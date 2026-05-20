import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  controlSize?: "md" | "lg";
};

export function Textarea({
  className,
  controlSize = "md",
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={cn(
        "ui-control-base px-4 py-3",
        controlSize === "lg" ? "min-h-32 text-base" : "min-h-28 text-sm",
        className
      )}
      {...props}
    />
  );
}
