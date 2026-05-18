import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceCardProps = HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
  children: ReactNode;
  as?: "section" | "div" | "article";
};

export function SurfaceCard({
  title,
  description,
  children,
  className,
  as: Component = "section",
  ...props
}: SurfaceCardProps) {
  return (
    <Component
      className={cn(
        "surface-card ui-card-base p-6 lg:p-7",
        className
      )}
      {...props}
    >
      {title ? (
        <header className="mb-5">
          <h2 className="text-display-md font-semibold text-[var(--color-ink)]">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </Component>
  );
}
