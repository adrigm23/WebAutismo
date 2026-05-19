import type { Metadata } from "next";
import Link from "next/link";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  robots: {
    index: false,
    follow: false
  }
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const token = firstValue((await searchParams).token)?.trim() ?? "";

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Seguridad de cuenta
          </p>
          <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Restablecer contraseña
          </h1>
          <p className="text-lg leading-8 text-[var(--color-muted)]">
            Define una nueva contraseña segura para recuperar el acceso al campus.
          </p>
        </div>

        <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          {token ? (
            <PasswordResetForm token={token} />
          ) : (
            <div className="rounded-2xl border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
              Falta el token de recuperación. Solicita un nuevo enlace.
            </div>
          )}
        </div>

        <div className="text-center text-sm text-[var(--color-muted)]">
          <Link
            className="text-[var(--color-primary)] underline-offset-4 hover:underline"
            href="/recuperar-contrasena"
          >
            Solicitar otro enlace
          </Link>
        </div>
      </div>
    </main>
  );
}
