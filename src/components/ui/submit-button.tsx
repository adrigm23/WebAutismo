"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function SubmitButton({
  children,
  pendingLabel = "Procesando...",
  className,
  variant = "primary",
  size = "md"
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-busy={pending}
      className={className}
      disabled={pending}
      size={size}
      type="submit"
      variant={variant}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
