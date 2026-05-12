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
      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#506174]">
        {props.label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#607185]">
          {props.icon}
        </div>
        <select
          className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm text-[var(--color-ink)]"
          defaultValue={props.defaultValue}
          name={props.name}
        >
          {props.children}
        </select>
      </div>
    </div>
  );
}
