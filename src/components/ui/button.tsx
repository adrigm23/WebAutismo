import type { ButtonHTMLAttributes, ComponentProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const baseStyles =
  "ui-button inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold tracking-[-0.01em] transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "[--button-fg:var(--color-surface-elevated)] [--button-fg-hover:var(--color-surface-elevated)] [--button-fg-disabled:color-mix(in_srgb,var(--color-surface-elevated)_78%,transparent)] bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-primary-strong)_100%)] shadow-[0_12px_22px_rgba(22,60,88,0.16)] hover:-translate-y-[1px] hover:shadow-[0_16px_28px_rgba(22,60,88,0.2)] focus-visible:ring-[var(--color-primary)]",
  neutral:
    "[--button-fg:var(--color-ink)] [--button-fg-hover:var(--color-ink)] border border-[var(--color-border)] bg-[color:var(--color-surface-elevated)] shadow-[var(--shadow-inset-soft)] hover:-translate-y-[1px] hover:border-[var(--color-border-strong)] hover:bg-white focus-visible:ring-[var(--color-primary)]",
  subtle:
    "[--button-fg:var(--color-ink-soft)] [--button-fg-hover:var(--color-primary)] hover:bg-[color:var(--color-brand-soft)] focus-visible:ring-[var(--color-primary)]",
  highlight:
    "[--button-fg:#1d1d1c] [--button-fg-hover:#1d1d1c] bg-[linear-gradient(180deg,var(--color-accent)_0%,#bf8b18_100%)] shadow-[0_12px_24px_rgba(211,154,31,0.16)] hover:-translate-y-[1px] hover:shadow-[0_16px_28px_rgba(211,154,31,0.22)] focus-visible:ring-[var(--color-accent)]",
  danger:
    "[--button-fg:var(--color-surface-elevated)] [--button-fg-hover:var(--color-surface-elevated)] [--button-fg-disabled:color-mix(in_srgb,var(--color-surface-elevated)_78%,transparent)] bg-[linear-gradient(180deg,var(--color-danger)_0%,#8f3d28_100%)] shadow-[0_12px_24px_rgba(159,69,46,0.18)] hover:-translate-y-[1px] hover:shadow-[0_16px_28px_rgba(159,69,46,0.24)] focus-visible:ring-[var(--color-danger)]"
} as const;

const sizes = {
  sm: "min-h-10 px-3.5 py-2 text-sm",
  md: "min-h-[var(--control-height-md)] px-4 py-2.5 text-sm",
  lg: "min-h-[var(--control-height-lg)] px-5 py-3 text-base",
  icon: "min-h-[var(--control-height-md)] min-w-[var(--control-height-md)] px-0 text-sm"
} as const;

const legacyVariantMap = {
  secondary: "neutral",
  ghost: "subtle",
  accent: "highlight"
} as const;

export type ButtonVariant =
  | keyof typeof variants
  | keyof typeof legacyVariantMap;

export type ButtonSize = keyof typeof sizes;

function resolveVariant(variant: ButtonVariant) {
  return variant in legacyVariantMap
    ? variants[legacyVariantMap[variant as keyof typeof legacyVariantMap]]
    : variants[variant as keyof typeof variants];
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(baseStyles, sizes[size], resolveVariant(variant), className)}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(baseStyles, sizes[size], resolveVariant(variant), className)}
      {...props}
    />
  );
}
