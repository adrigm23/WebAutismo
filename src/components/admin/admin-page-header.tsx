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
        "flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between",
        className
      )}
    >
      <div className="max-w-4xl">
        <h1 className="text-[3.3rem] font-semibold leading-none tracking-[-0.08em] text-[var(--color-ink)] sm:text-[4rem]">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-[1.12rem] leading-8 text-[#33465a]">{description}</p>
      </div>

      {actions ? <div className="flex flex-wrap gap-3 xl:justify-end">{actions}</div> : null}
    </div>
  );
}
