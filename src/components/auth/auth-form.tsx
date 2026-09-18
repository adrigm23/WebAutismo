"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormEvent } from "react";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldName = "name" | "email" | "password" | "confirmPassword";

type FieldValues = Record<FieldName, string>;

// Mirrors registerSchema/loginSchema in src/actions/auth.ts, field by field
// and message by message, so the inline error is never inconsistent with
// what the server would actually reject.
function validateField(
  field: FieldName,
  values: FieldValues,
  mode: "login" | "register",
): string | null {
  const value = values[field];

  if (field === "name") {
    if (mode !== "register") return null;
    return value.trim().length >= 2 ? null : "Introduce tu nombre.";
  }

  if (field === "email") {
    return EMAIL_PATTERN.test(value.trim()) ? null : "Introduce un email válido.";
  }

  if (field === "password") {
    return value.length >= 8
      ? null
      : "La contraseña debe tener al menos 8 caracteres.";
  }

  // confirmPassword
  if (mode !== "register") return null;
  if (value.length < 8) return "Confirma la contraseña.";
  return value === values.password ? null : "Las contraseñas no coinciden.";
}

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

  const [values, setValues] = useState<FieldValues>({
    name: state.fields?.name ?? "",
    email: state.fields?.email ?? "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});

  function updateField(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function markTouched(field: FieldName) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function errorFor(field: FieldName): string | undefined {
    if (!touched[field]) return undefined;
    return validateField(field, values, mode) ?? undefined;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const fields: FieldName[] =
      mode === "register"
        ? ["name", "email", "password", "confirmPassword"]
        : ["email", "password"];

    const hasClientError = fields.some((field) => validateField(field, values, mode));

    if (hasClientError) {
      event.preventDefault();
      setTouched((current) => {
        const next = { ...current };
        for (const field of fields) next[field] = true;
        return next;
      });
    }
  }

  return (
    <form
      action={formAction}
      className={cn("flex flex-col gap-5", className)}
      onSubmit={handleSubmit}
    >
      {mode === "register" ? (
        <FormField
          error={errorFor("name")}
          htmlFor="auth-name"
          label="Nombre y apellidos"
          required
        >
          <Input
            aria-invalid={Boolean(errorFor("name"))}
            id="auth-name"
            name="name"
            onBlur={() => markTouched("name")}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Tu nombre completo"
            required
            value={values.name}
          />
        </FormField>
      ) : null}

      <FormField error={errorFor("email")} htmlFor="auth-email" label="Correo electrónico" required>
        <Input
          aria-invalid={Boolean(errorFor("email"))}
          autoComplete="email"
          id="auth-email"
          name="email"
          onBlur={() => markTouched("email")}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="tu@email.com"
          required
          type="email"
          value={values.email}
        />
      </FormField>

      <FormField error={errorFor("password")} htmlFor="auth-password" label="Contraseña" required>
        <Input
          aria-invalid={Boolean(errorFor("password"))}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          id="auth-password"
          name="password"
          onBlur={() => markTouched("password")}
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="Introduce tu contraseña"
          required
          type="password"
          value={values.password}
        />
      </FormField>

      {mode === "login" && showForgotLink ? (
        <div className="-mt-2 flex justify-end">
          <Link
            className="text-sm font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
            href="/recuperar-contrasena"
          >
            Has olvidado tu contraseña
          </Link>
        </div>
      ) : null}

      {mode === "register" ? (
        <FormField
          error={errorFor("confirmPassword")}
          htmlFor="auth-confirm-password"
          label="Confirmar contraseña"
          required
        >
          <Input
            aria-invalid={Boolean(errorFor("confirmPassword"))}
            autoComplete="new-password"
            id="auth-confirm-password"
            name="confirmPassword"
            onBlur={() => markTouched("confirmPassword")}
            onChange={(event) => updateField("confirmPassword", event.target.value)}
            placeholder="Repite tu contraseña"
            required
            type="password"
            value={values.confirmPassword}
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
