import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormFieldProps = HTMLAttributes<HTMLDivElement> & {
  label?: ReactNode;
  htmlFor?: string;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  description,
  error,
  required = false,
  actions,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label ? (
        <div className="flex items-end justify-between gap-3">
          <label
            className="text-sm font-medium text-[var(--color-ink)]"
            htmlFor={htmlFor}
          >
            {label}
            {required ? (
              <span aria-hidden className="ml-1 text-[var(--color-danger)]">
                *
              </span>
            ) : null}
          </label>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}

      {children}

      {error ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : description ? (
        <p className="text-sm leading-6 text-[var(--color-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
