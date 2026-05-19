"use client";

import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type AccountSecurityFormState
} from "@/actions/account-security";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AccountSecurityFormState = {};

export function PasswordResetRequestForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Correo electrónico</span>
        <Input autoComplete="email" name="email" placeholder="tu@email.com" required type="email" />
      </label>

      {state.error ? (
        <p
          aria-live="polite"
          className="rounded-2xl border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]"
          role="status"
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          aria-live="polite"
          className="rounded-2xl border border-[rgba(12,113,195,0.14)] bg-white px-4 py-3 text-sm text-[var(--color-ink)]"
          role="status"
        >
          {state.success}
        </p>
      ) : null}

      <SubmitButton className="w-full" pendingLabel="Enviando instrucciones...">
        Enviar enlace de recuperación
      </SubmitButton>
    </form>
  );
}
