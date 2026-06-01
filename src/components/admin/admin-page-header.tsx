import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
};

export function AdminPageHeader({
  title,
  description,
  actions,
  className
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8",
        className
      )}
    >
      <div className="min-w-0 max-w-[72rem]">
        <h1 className="text-display-md font-premium font-semibold text-[var(--color-ink)]">
          {title}
        </h1>
        <p className="text-body-md mt-3 max-w-[62ch] text-[var(--color-muted)]">
          {description}
        </p>
      </div>

      {actions ? (
        <div className="flex flex-wrap gap-3 xl:max-w-[24rem] xl:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
