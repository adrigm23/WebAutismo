import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck, ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";
import { resendEmailVerificationAction } from "@/actions/account-security";
import { logoutAction } from "@/actions/session";
import { AuthCenteredShell } from "@/components/auth/auth-shells";
import { Button } from "@/components/ui/button";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Verificacion pendiente",
  robots: {
    index: false,
    follow: false,
  },
};

type VerificationPendingPageProps = {
  searchParams: Promise<{
    sent?: string | string[];
    error?: string | string[];
  }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerificationPendingPage({
  searchParams,
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
    <AuthCenteredShell
      content={
        <div className="flex flex-col gap-5">
          {sent ? (
            <StateBanner
              description={
                <>
                  Hemos reenviado un nuevo enlace de verificacion a{" "}
                  <strong>{user.email}</strong>.
                </>
              }
              icon={
                <MailCheck
                  className="size-4 text-[var(--color-primary)]"
                  strokeWidth={2}
                />
              }
              title="Nuevo enlace enviado"
              tone="success"
            />
          ) : null}

          {error === "email-delivery" ? (
            <StateBanner
              description="El envio de correo no esta configurado correctamente en este entorno."
              icon={
                <ShieldAlert
                  className="size-4 text-[var(--color-danger)]"
                  strokeWidth={2}
                />
              }
              tone="danger"
            />
          ) : null}

          <SurfaceCard padding="md">
            <p className="text-base leading-8 text-[var(--color-text)]">
              Cuenta pendiente: <strong>{user.email}</strong>
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
              Revisa tu bandeja de entrada y tambien la carpeta de spam. Si el
              enlace ha caducado, puedes solicitar uno nuevo.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <form action={resendEmailVerificationAction}>
                <input
                  name="nextPath"
                  type="hidden"
                  value="/verificacion-pendiente"
                />
                <Button type="submit">Reenviar verificacion</Button>
              </form>

              <form action={logoutAction}>
                <Button type="submit" variant="neutral">
                  Cerrar sesion
                </Button>
              </form>
            </div>
          </SurfaceCard>
        </div>
      }
      description="Hemos bloqueado temporalmente el acceso al campus hasta que confirmes la direccion de correo asociada a tu cuenta."
      footer={
        <Link
          className="text-sm text-[var(--color-primary)] underline-offset-4 hover:underline"
          href="/soporte"
        >
          Necesito ayuda con la verificacion
        </Link>
      }
      title="Verifica tu correo antes de continuar"
    />
  );
}
