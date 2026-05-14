"use client";

import { useActionState } from "react";
import { resetPasswordAction, type AccountSecurityFormState } from "@/actions/account-security";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AccountSecurityFormState = {};

export function PasswordResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="token" type="hidden" value={token} />

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Nueva contrasena</span>
        <Input
          autoComplete="new-password"
          name="password"
          placeholder="Introduce tu nueva contrasena"
          required
          type="password"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Confirmar contrasena</span>
        <Input
          autoComplete="new-password"
          name="confirmPassword"
          placeholder="Repite tu nueva contrasena"
          required
          type="password"
        />
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

      <SubmitButton className="w-full" pendingLabel="Actualizando contrasena...">
        Guardar nueva contrasena
      </SubmitButton>
    </form>
  );
}
