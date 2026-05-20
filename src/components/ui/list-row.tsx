import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ListRowProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  emphasis?: "default" | "muted";
};

export function ListRow({
  title,
  description,
  eyebrow,
  leading,
  trailing,
  emphasis = "default",
  className,
  ...props
}: ListRowProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-[var(--radius-md)] border px-4 py-4",
        emphasis === "muted"
          ? "border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
          : "border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)]",
        className
      )}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="text-meta-xs font-semibold text-[var(--color-muted)]">{eyebrow}</p>
        ) : null}
        <p className={cn("font-semibold text-[var(--color-ink)]", eyebrow ? "mt-1.5" : "")}>
          {title}
        </p>
        {description ? (
          <p className="mt-2 text-body-sm text-[var(--color-muted)]">{description}</p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
