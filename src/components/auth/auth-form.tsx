"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type AuthFormState } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

const initialState: AuthFormState = {};

type AuthFormProps = {
  mode: "login" | "register";
  next?: string;
  className?: string;
  submitLabel?: string;
  pendingLabel?: string;
  showForgotLink?: boolean;
};

export function AuthForm({
  mode,
  next,
  className,
  submitLabel,
  pendingLabel,
  showForgotLink = false
}: AuthFormProps) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className={cn("space-y-4", className)}>
      {mode === "register" ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">Nombre y apellidos</span>
          <Input name="name" placeholder="Tu nombre" required />
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Correo electronico</span>
        <Input autoComplete="email" name="email" placeholder="tu@email.com" required type="email" />
      </label>

      <label className="block space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-[var(--color-ink)]">Contrasena</span>
          {mode === "login" && showForgotLink ? (
            <Link
              className="text-sm font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
              href="mailto:formacion@autismocordoba.org?subject=Recuperacion%20de%20contrasena"
            >
              Has olvidado tu contrasena?
            </Link>
          ) : null}
        </div>
        <Input
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          name="password"
          placeholder="Introduce tu contrasena"
          required
          type="password"
        />
      </label>

      {mode === "register" ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">Confirmar contrasena</span>
          <Input
            autoComplete="new-password"
            name="confirmPassword"
            placeholder="Repite tu contrasena"
            required
            type="password"
          />
        </label>
      ) : null}

      <input name="next" type="hidden" value={next || ""} />

      {state.error ? (
        <p
          aria-live="polite"
          className="rounded-2xl border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]"
          role="status"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton className="w-full" pendingLabel={pendingLabel ?? "Validando..."}>
        {submitLabel ?? (mode === "login" ? "Acceder" : "Crear cuenta")}
      </SubmitButton>
    </form>
  );
}
