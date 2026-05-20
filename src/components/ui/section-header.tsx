import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  size?: "md" | "lg";
  align?: "left" | "center";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  size = "lg",
  align = "left",
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        actions && "xl:flex-row xl:items-end xl:justify-between",
        align === "center" && "text-center",
        className
      )}
      {...props}
    >
      <div className={cn("min-w-0", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="text-meta-xs font-semibold text-[var(--color-primary)]">{eyebrow}</p>
        ) : null}
        <h2
          className={cn(
            "font-premium font-semibold text-[var(--color-ink)]",
            eyebrow && "mt-3",
            size === "lg" ? "text-display-lg" : "text-display-md"
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-[70ch] text-body-sm text-[var(--color-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={cn(
            "flex shrink-0 flex-wrap gap-3",
            align === "center" && "justify-center"
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
