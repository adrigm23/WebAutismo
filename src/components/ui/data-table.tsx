import type { HTMLAttributes, ReactNode, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function DataTable({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full max-w-full overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]">
      <table className={cn("min-w-full border-separate border-spacing-0 text-left", className)} {...props} />
    </div>
  );
}

export function DataTableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-[color:var(--color-bg-subtle)]", className)} {...props} />;
}

export function DataTableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-[var(--color-border-subtle)]", className)} {...props} />;
}

export function DataTableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "align-top transition-colors duration-[var(--motion-duration-fast)] hover:bg-[rgba(22,60,88,0.02)]",
        className
      )}
      {...props}
    />
  );
}

export function DataTableHead({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-5 py-4 text-meta-xs font-semibold text-[var(--color-muted)]",
        className
      )}
      {...props}
    />
  );
}

export function DataTableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-5 py-4 text-body-sm text-[var(--color-ink)]", className)}
      {...props}
    />
  );
}

type DataTableEmptyProps = {
  colSpan: number;
  title?: ReactNode;
  description: ReactNode;
};

export function DataTableEmpty({
  colSpan,
  title,
  description
}: DataTableEmptyProps) {
  return (
    <tr>
      <td className="px-5 py-8" colSpan={colSpan}>
        <div className="ui-empty-state-subtle rounded-[var(--radius-md)] px-5 py-6">
          {title ? <p className="font-semibold text-[var(--color-ink)]">{title}</p> : null}
          <p className={cn("text-body-sm text-[var(--color-muted)]", title && "mt-2")}>
            {description}
          </p>
        </div>
      </td>
    </tr>
  );
}
