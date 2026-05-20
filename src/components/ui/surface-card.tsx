import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceCardProps = HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
  children: ReactNode;
  as?: "section" | "div" | "article";
  actions?: ReactNode;
  variant?: "default" | "muted" | "interactive";
  padding?: "md" | "lg";
};

export function SurfaceCard({
  title,
  description,
  children,
  className,
  as: Component = "section",
  actions,
  variant = "default",
  padding = "lg",
  ...props
}: SurfaceCardProps) {
  return (
    <Component
      className={cn(
        "surface-card ui-card-base",
        variant === "muted" && "ui-card-muted",
        variant === "interactive" && "ui-card-interactive",
        padding === "md" ? "p-5 lg:p-6" : "p-6 lg:p-7",
        className
      )}
      {...props}
    >
      {title ? (
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-display-md font-semibold text-[var(--color-ink)]">{title}</h2>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </Component>
  );
}
