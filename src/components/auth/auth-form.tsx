"use client";

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
        <span className="text-sm font-medium text-[var(--color-ink)]">Correo electrónico</span>
        <Input name="email" placeholder="tu@email.com" required type="email" />
      </label>

      <label className="block space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-[var(--color-ink)]">Contraseña</span>
          {mode === "login" && showForgotLink ? (
            <span className="text-sm font-medium text-[var(--color-primary)]">
              ¿Olvidaste tu contraseña?
            </span>
          ) : null}
        </div>
        <Input name="password" placeholder="••••••••" required type="password" />
      </label>

      {mode === "register" ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">Confirmar contraseña</span>
          <Input
            name="confirmPassword"
            placeholder="••••••••"
            required
            type="password"
          />
        </label>
      ) : null}

      <input name="next" type="hidden" value={next || ""} />

      {state.error ? (
        <p className="rounded-2xl border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
          {state.error}
        </p>
      ) : null}

      <SubmitButton className="w-full" pendingLabel={pendingLabel ?? "Validando..."}>
        {submitLabel ?? (mode === "login" ? "Acceder" : "Crear cuenta")}
      </SubmitButton>
    </form>
  );
}
