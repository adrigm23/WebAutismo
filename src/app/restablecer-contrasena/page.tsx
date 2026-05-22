import type { Metadata } from "next";
import { AuthCenteredShell } from "@/components/auth/auth-shells";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { ButtonLink } from "@/components/ui/button";
import { StateBanner } from "@/components/ui/state-banner";

export const metadata: Metadata = {
  title: "Restablecer contrasena",
  robots: {
    index: false,
    follow: false,
  },
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const token = firstValue((await searchParams).token)?.trim() ?? "";

  return (
    <AuthCenteredShell
      content={
        token ? (
          <PasswordResetForm token={token} />
        ) : (
          <StateBanner
            description="Falta el token de recuperacion. Solicita un nuevo enlace."
            tone="danger"
          />
        )
      }
      description="Define una nueva contrasena segura para recuperar el acceso al campus."
      footer={
        <ButtonLink href="/recuperar-contrasena" size="sm" variant="subtle">
          Solicitar otro enlace
        </ButtonLink>
      }
      title="Restablecer contrasena"
    />
  );
}
