import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricPanelTone = "default" | "brand" | "success" | "warning";

type MetricPanelProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  tone?: MetricPanelTone;
};

const toneClasses: Record<MetricPanelTone, string> = {
  default: "",
  brand: "border-[color:rgba(22,60,88,0.16)] bg-[linear-gradient(180deg,rgba(255,253,250,0.98),rgba(223,234,243,0.48))]",
  success: "border-[color:rgba(23,98,79,0.14)] bg-[linear-gradient(180deg,rgba(255,253,250,0.98),rgba(228,241,235,0.62))]",
  warning: "border-[color:rgba(139,100,23,0.16)] bg-[linear-gradient(180deg,rgba(255,253,250,0.98),rgba(248,239,216,0.72))]"
};

export function MetricPanel({
  label,
  value,
  detail,
  icon,
  actions,
  tone = "default",
  className,
  ...props
}: MetricPanelProps) {
  return (
    <Card className={cn("p-5", toneClasses[tone], className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-label-sm font-semibold text-[var(--color-muted)]">{label}</p>
          <p className="font-premium mt-3 text-[1.95rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-ink)] [font-variant-numeric:tabular-nums]">
            {value}
          </p>
          {detail ? (
            <p className="mt-2 text-body-sm text-[var(--color-muted)]">{detail}</p>
          ) : null}
        </div>
        {icon || actions ? (
          <div className="flex shrink-0 flex-col items-end gap-2">
            {icon ? (
              <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-white/72 text-[var(--color-primary)]">
                {icon}
              </div>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
