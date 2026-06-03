"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  loginAction,
  registerAction,
  type AuthFormState,
} from "@/actions/auth";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { StateBanner } from "@/components/ui/state-banner";
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
  showForgotLink = false,
}: AuthFormProps) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useActionState(action, initialState);
  const fieldValues = {
    name: state.fields?.name ?? "",
    email: state.fields?.email ?? "",
  };

  return (
    <form action={formAction} className={cn("flex flex-col gap-5", className)}>
      {mode === "register" ? (
        <FormField htmlFor="auth-name" label="Nombre y apellidos" required>
          <Input
            defaultValue={fieldValues.name}
            id="auth-name"
            key={`auth-name:${fieldValues.name}`}
            name="name"
            placeholder="Tu nombre completo"
            required
          />
        </FormField>
      ) : null}

      <FormField htmlFor="auth-email" label="Correo electrónico" required>
        <Input
          autoComplete="email"
          defaultValue={fieldValues.email}
          id="auth-email"
          key={`auth-email:${fieldValues.email}`}
          name="email"
          placeholder="tu@email.com"
          required
          type="email"
        />
      </FormField>

      <FormField htmlFor="auth-password" label="Contraseña" required>
        <Input
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          id="auth-password"
          name="password"
          placeholder="Introduce tu contraseña"
          required
          type="password"
        />
      </FormField>

      {mode === "login" && showForgotLink ? (
        <div className="-mt-2 flex justify-end">
          <Link
            className="text-sm font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
            href="/recuperar-contraseña"
          >
            Has olvidado tu contraseña
          </Link>
        </div>
      ) : null}

      {mode === "register" ? (
        <FormField
          htmlFor="auth-confirm-password"
          label="Confirmar contraseña"
          required
        >
          <Input
            autoComplete="new-password"
            id="auth-confirm-password"
            name="confirmPassword"
            placeholder="Repite tu contraseña"
            required
            type="password"
          />
        </FormField>
      ) : null}

      <input name="next" type="hidden" value={next || ""} />

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
        pendingLabel={pendingLabel ?? "Validando..."}
      >
        {submitLabel ??
          (mode === "login" ? "Acceder al panel" : "Crear cuenta")}
      </SubmitButton>
    </form>
  );
}
