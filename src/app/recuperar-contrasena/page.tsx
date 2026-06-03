import type { Metadata } from "next";
import { AuthCenteredShell } from "@/components/auth/auth-shells";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCenteredShell
      content={<PasswordResetRequestForm />}
      description="Introduce el correo de tu cuenta. Si existe una cuenta activa, enviaremos un enlace temporal para restablecer la contraseña."
      footer={
        <ButtonLink href="/acceder" size="sm" variant="subtle">
          Volver a acceso
        </ButtonLink>
      }
      title="Recuperar contraseña"
    />
  );
}
