import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "subtle";
  align?: "left" | "center";
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  tone = "default",
  align = "left",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "ui-empty-state px-6 py-8",
        tone === "subtle" && "ui-empty-state-subtle",
        align === "center" && "text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <div
          className={cn(
            "mb-4 inline-grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]",
            align === "center" && "mx-auto"
          )}
        >
          {icon}
        </div>
      ) : null}
      <h3 className="font-premium text-heading-md font-semibold text-[var(--color-ink)]">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-[60ch] text-body-sm text-[var(--color-muted)]">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className={cn("mt-5 flex flex-wrap gap-3", align === "center" && "justify-center")}>
          {action}
        </div>
      ) : null}
    </div>
  );
}
