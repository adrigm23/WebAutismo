import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  tone?: "brand" | "light" | "success";
  className?: string;
};

export function ProgressBar({ value, tone = "brand", className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn(
        "h-1.5 overflow-hidden rounded-full",
        tone === "light"
          ? "bg-white/16"
          : tone === "success"
            ? "bg-[var(--color-success-soft)]"
            : "bg-[rgba(38,56,91,0.1)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "h-full rounded-full transition-[width] duration-300",
          tone === "light"
            ? "bg-[rgba(245,248,252,0.96)]"
            : tone === "success"
              ? "bg-[var(--color-success)]"
              : "bg-[var(--color-primary)]",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
