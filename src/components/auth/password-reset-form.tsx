"use client";

import { useActionState } from "react";
import {
  resetPasswordAction,
  type AccountSecurityFormState,
} from "@/actions/account-security";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { StateBanner } from "@/components/ui/state-banner";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AccountSecurityFormState = {};

export function PasswordResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input name="token" type="hidden" value={token} />

      <FormField htmlFor="reset-password" label="Nueva contraseña" required>
        <Input
          autoComplete="new-password"
          id="reset-password"
          name="password"
          placeholder="Introduce tu nueva contraseña"
          required
          type="password"
        />
      </FormField>

      <FormField
        htmlFor="reset-confirm-password"
        label="Confirmar contraseña"
        required
      >
        <Input
          autoComplete="new-password"
          id="reset-confirm-password"
          name="confirmPassword"
          placeholder="Repite tu nueva contraseña"
          required
          type="password"
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

      <SubmitButton
        className="w-full"
        pendingLabel="Actualizando contraseña..."
      >
        Guardar nueva contraseña
      </SubmitButton>
    </form>
  );
}
