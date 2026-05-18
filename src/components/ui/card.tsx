import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  surface?: "default" | "glass";
};

export function Card({ className, surface = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "ui-card-base",
        surface === "glass" && "backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
