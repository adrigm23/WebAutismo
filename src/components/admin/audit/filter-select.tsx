import type { ReactNode } from "react";

export function FilterSelect(props: {
  defaultValue: string;
  icon: ReactNode;
  label: string;
  name: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-meta-xs font-semibold text-[var(--color-muted)]">{props.label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
          {props.icon}
        </div>
        <select
          className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] pl-10 pr-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-canvas)]"
          defaultValue={props.defaultValue}
          name={props.name}
        >
          {props.children}
        </select>
      </div>
    </div>
  );
}
