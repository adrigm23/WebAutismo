"use client";

import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type AccountSecurityFormState,
} from "@/actions/account-security";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { StateBanner } from "@/components/ui/state-banner";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AccountSecurityFormState = {};

export function PasswordResetRequestForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormField
        description="Usa el correo con el que accedes habitualmente al campus."
        htmlFor="reset-request-email"
        label="Correo electrónico"
        required
      >
        <Input
          autoComplete="email"
          id="reset-request-email"
          name="email"
          placeholder="tu@email.com"
          required
          type="email"
        />
      </FormField>

      {state.error ? (
        <StateBanner
          aria-live="polite"
          description={state.error}
          role="status"
          tone="danger"
        />
      ) : null}

      {state.success ? (
        <StateBanner
          aria-live="polite"
          description={state.success}
          role="status"
          tone="success"
        />
      ) : null}

      <SubmitButton className="w-full" pendingLabel="Enviando instrucciones...">
        Enviar enlace de recuperacion
      </SubmitButton>
    </form>
  );
}
