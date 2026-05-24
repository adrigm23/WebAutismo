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
        <h1 className="font-premium text-[2.85rem] font-semibold leading-[0.94] tracking-[-0.08em] text-[var(--color-ink)] sm:text-[3.5rem] xl:text-[4.05rem]">
          {title}
        </h1>
        <p className="mt-4 max-w-[62ch] text-base leading-8 text-[var(--color-muted)] sm:text-[1.12rem]">
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
