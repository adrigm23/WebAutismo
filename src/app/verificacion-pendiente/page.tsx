import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resendEmailVerificationAction } from "@/actions/account-security";
import { logoutAction } from "@/actions/session";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Verificación pendiente",
  robots: {
    index: false,
    follow: false
  }
};

type VerificationPendingPageProps = {
  searchParams: Promise<{ sent?: string | string[]; error?: string | string[] }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerificationPendingPage({
  searchParams
}: VerificationPendingPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const sent = firstValue(params.sent) === "1";
  const error = firstValue(params.error);

  if (!user) {
    redirect("/acceder");
  }

  if (user.emailVerifiedAt) {
    redirect("/mi-cuenta");
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Seguridad de cuenta
          </p>
          <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Verifica tu correo antes de continuar
          </h1>
          <p className="text-lg leading-8 text-[var(--color-muted)]">
            Hemos bloqueado temporalmente el acceso al campus hasta que confirmes la dirección de
            correo asociada a tu cuenta.
          </p>
        </div>

        {sent ? (
          <div className="rounded-[24px] border border-[rgba(12,113,195,0.14)] bg-white px-5 py-4 text-sm leading-7 text-[var(--color-ink)] shadow-[0_12px_24px_rgba(34,34,33,0.05)]">
            Hemos reenviado un nuevo enlace de verificación a <strong>{user.email}</strong>.
          </div>
        ) : null}

        {error === "email-delivery" ? (
          <div className="rounded-2xl border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
            El envío de correo no está configurado correctamente en este entorno.
          </div>
        ) : null}

        <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <p className="text-base leading-8 text-[var(--color-ink)]">
            Cuenta pendiente: <strong>{user.email}</strong>
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            Revisa tu bandeja de entrada y también la carpeta de spam. Si el enlace ha caducado,
            puedes solicitar uno nuevo.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <form action={resendEmailVerificationAction}>
              <input name="nextPath" type="hidden" value="/verificacion-pendiente" />
              <button className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90" type="submit">
                Reenviar verificación
              </button>
            </form>

            <form action={logoutAction}>
              <button className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]" type="submit">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-sm text-[var(--color-muted)]">
          <Link className="text-[var(--color-primary)] underline-offset-4 hover:underline" href="/soporte">
            Necesito ayuda con la verificación
          </Link>
        </div>
      </div>
    </main>
  );
}
