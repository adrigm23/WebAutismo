import type { ButtonHTMLAttributes, ComponentProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const baseStyles =
  "inline-flex min-h-[var(--control-height-md)] items-center justify-center rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-primary-strong)_100%)] text-white shadow-[0_14px_26px_rgba(12,113,195,0.18)] hover:-translate-y-[1px] hover:shadow-[0_18px_30px_rgba(12,113,195,0.24)] focus-visible:ring-[var(--color-primary)]",
  neutral:
    "border border-[rgba(12,113,195,0.18)] bg-white/94 text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)] hover:-translate-y-[1px] hover:border-[rgba(12,113,195,0.34)] hover:bg-[rgba(12,113,195,0.05)] focus-visible:ring-[var(--color-primary)]",
  subtle:
    "text-[var(--color-primary)] hover:bg-white/80 hover:text-[var(--color-primary-strong)] focus-visible:ring-[var(--color-primary)]",
  highlight:
    "bg-[linear-gradient(180deg,var(--color-accent)_0%,#f1aa00_100%)] text-[#1d1d1c] shadow-[0_12px_24px_rgba(255,182,6,0.18)] hover:-translate-y-[1px] hover:shadow-[0_16px_28px_rgba(255,182,6,0.24)] focus-visible:ring-[var(--color-accent)]"
} as const;

const legacyVariantMap = {
  secondary: "neutral",
  ghost: "subtle",
  accent: "highlight"
} as const;

export type ButtonVariant =
  | keyof typeof variants
  | keyof typeof legacyVariantMap;

function resolveVariant(variant: ButtonVariant) {
  return variant in legacyVariantMap
    ? variants[legacyVariantMap[variant as keyof typeof legacyVariantMap]]
    : variants[variant as keyof typeof variants];
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={cn(baseStyles, resolveVariant(variant), className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  className?: string;
};

export function ButtonLink({ className, variant = "primary", ...props }: ButtonLinkProps) {
  return <Link className={cn(baseStyles, resolveVariant(variant), className)} {...props} />;
}
