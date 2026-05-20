import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type StateBannerTone = "info" | "success" | "warning" | "danger";

type StateBannerProps = HTMLAttributes<HTMLDivElement> & {
  tone?: StateBannerTone;
  title?: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
};

const tones: Record<StateBannerTone, string> = {
  info: "border-[color:var(--color-border-subtle)] bg-[color:var(--color-brand-soft)] text-[var(--color-primary)]",
  success: "border-[color:rgba(23,98,79,0.18)] bg-[color:var(--color-success-soft)] text-[var(--color-success)]",
  warning: "border-[color:rgba(139,100,23,0.2)] bg-[color:var(--color-warning-soft)] text-[var(--color-warning)]",
  danger: "border-[color:rgba(159,69,46,0.2)] bg-[color:var(--color-danger-soft)] text-[var(--color-danger)]"
};

export function StateBanner({
  tone = "info",
  title,
  description,
  icon,
  actions,
  className,
  ...props
}: StateBannerProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border px-5 py-4",
        tones[tone],
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          {icon ? (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-white/55">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            {title ? (
              <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
            ) : null}
            <p className={cn("text-sm leading-6", title && "mt-1.5", "text-current")}>
              {description}
            </p>
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
