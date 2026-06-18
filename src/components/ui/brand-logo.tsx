import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
  withText?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { px: 32, textClass: "text-sm" },
  md: { px: 40, textClass: "text-base" },
  lg: { px: 56, textClass: "text-lg" },
};

export function BrandLogo({
  size = "md",
  variant = "default",
  withText = false,
  className,
}: BrandLogoProps) {
  const { px, textClass } = sizeMap[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="Autismo Córdoba"
        className={cn("shrink-0", variant === "white" && "brightness-0 invert")}
        height={px}
        src="/brand/isotipo-autismo-cordoba.png"
        style={{ width: px, height: px }}
        width={px}
      />
      {withText && (
        <span
          className={cn(
            "font-semibold leading-tight tracking-tight",
            textClass,
            variant === "white"
              ? "text-white"
              : "text-[var(--color-ink,#0d1920)]",
          )}
        >
          Autismo Córdoba
        </span>
      )}
    </span>
  );
}
