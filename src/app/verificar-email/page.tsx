import type { Metadata } from "next";
import Link from "next/link";
import { consumeEmailVerificationToken } from "@/lib/account-security";

export const metadata: Metadata = {
  title: "Verificar email",
  robots: {
    index: false,
    follow: false
  }
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const token = firstValue((await searchParams).token)?.trim() ?? "";
  const verifiedUser = token ? await consumeEmailVerificationToken(token) : null;

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-xl space-y-8 text-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Seguridad de cuenta
          </p>
          <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            {verifiedUser ? "Correo verificado" : "No hemos podido verificar el correo"}
          </h1>
          <p className="text-lg leading-8 text-[var(--color-muted)]">
            {verifiedUser
              ? "Tu direccion de correo ya ha quedado validada. Ahora puedes acceder al campus con normalidad."
              : "El enlace no es valido, ya se ha utilizado o ha caducado. Solicita una nueva verificacion desde tu cuenta."}
          </p>
        </div>

        <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              href="/acceder"
            >
              Ir a acceso
            </Link>
            <Link
              className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              href="/soporte"
            >
              Contactar soporte
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
