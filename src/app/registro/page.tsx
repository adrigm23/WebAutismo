import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCenteredShell } from "@/components/auth/auth-shells";
import { AuthForm } from "@/components/auth/auth-form";
import { StateBanner } from "@/components/ui/state-banner";
import { getCurrentUser } from "@/lib/auth";
import { isDemoAuthEnabled } from "@/lib/env";
import { getDefaultPrivateRedirect, getSafeRedirect } from "@/lib/redirect";
import { firstValue } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: {
    index: false,
    follow: false,
  },
};

type RegisterPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  const requestedNext = firstValue(next);
  const safeNext = requestedNext ? getSafeRedirect(requestedNext, "/mis-cursos") : undefined;

  if (user) {
    redirect(safeNext ?? getDefaultPrivateRedirect(user.globalRole));
  }

  return (
    <AuthCenteredShell
      content={
        <AuthForm
          mode="register"
          next={safeNext}
          pendingLabel="Creando cuenta..."
          submitLabel="Comenzar ahora"
        />
      }
      description="Crea tu cuenta profesional para acceder al campus, a tus recursos y a la comunidad privada."
      footer={
        isDemoAuthEnabled() ? (
          <StateBanner
            className="text-left"
            description="Modo demo habilitado solo para entornos locales configurados."
            title="Entorno de validacion"
            tone="info"
          />
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            Tus datos se procesan con criterios de privacidad y acceso
            institucional.
          </p>
        )
      }
      title="Crea tu cuenta profesional"
    />
  );
}
