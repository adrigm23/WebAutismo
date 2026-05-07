import type { ButtonHTMLAttributes, ComponentProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "bg-[var(--color-primary)] text-white shadow-[0_16px_30px_rgba(12,113,195,0.18)] hover:bg-[var(--color-primary-strong)] focus-visible:ring-[var(--color-primary)]",
  secondary:
    "border border-[var(--color-primary)] bg-white text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] focus-visible:ring-[var(--color-primary)]",
  ghost:
    "text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] focus-visible:ring-[var(--color-primary)]",
  accent:
    "bg-[var(--color-accent)] text-[#1d1d1c] shadow-[0_14px_24px_rgba(255,182,6,0.18)] hover:bg-[#f1aa00] focus-visible:ring-[var(--color-accent)]"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={cn(baseStyles, variants[variant], className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  className?: string;
};

export function ButtonLink({ className, variant = "primary", ...props }: ButtonLinkProps) {
  return <Link className={cn(baseStyles, variants[variant], className)} {...props} />;
}
