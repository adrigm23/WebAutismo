"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ComponentProps<typeof Button> & {
  children: ReactNode;
  message: string;
  pendingLabel?: string;
};

export function ConfirmSubmitButton({
  children,
  message,
  pendingLabel = "Procesando...",
  className,
  onClick,
  type = "submit",
  variant = "primary",
  ...props
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
      type={type}
      variant={variant}
      {...props}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
