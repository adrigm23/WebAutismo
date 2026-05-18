import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "ui-control-base min-h-28 px-4 py-3 text-sm",
        className
      )}
      {...props}
    />
  );
}
