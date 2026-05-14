import type { Metadata } from "next";
import Link from "next/link";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form";

export const metadata: Metadata = {
  title: "Recuperar contrasena",
  robots: {
    index: false,
    follow: false
  }
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Seguridad de cuenta
          </p>
          <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Recuperar contrasena
          </h1>
          <p className="text-lg leading-8 text-[var(--color-muted)]">
            Introduce el correo de tu cuenta. Si existe una cuenta activa, enviaremos un enlace
            temporal para restablecer la contrasena.
          </p>
        </div>

        <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <PasswordResetRequestForm />
        </div>

        <div className="text-center text-sm text-[var(--color-muted)]">
          <Link className="text-[var(--color-primary)] underline-offset-4 hover:underline" href="/acceder">
            Volver a acceso
          </Link>
        </div>
      </div>
    </main>
  );
}
