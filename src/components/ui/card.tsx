import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  surface?: "default" | "glass";
  variant?: "default" | "muted" | "interactive" | "elevated";
};

const variants = {
  default: "",
  muted: "ui-card-muted",
  interactive: "ui-card-interactive",
  elevated: "bg-[color:var(--color-surface-elevated)] shadow-[var(--shadow-medium)]"
} as const;

export function Card({
  className,
  surface = "default",
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "ui-card-base",
        variants[variant],
        surface === "glass" && "backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
