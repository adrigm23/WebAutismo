"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthSplitShell } from "@/components/auth/auth-shells";

type SplitAuthPanelProps = {
  next?: string;
  showDemoNotice?: boolean;
  statusMessage?: string | null;
};

export function SplitAuthPanel({
  next,
  showDemoNotice = false,
  statusMessage = null,
}: SplitAuthPanelProps) {
  return (
    <AuthSplitShell
      leftContent={
        <AuthForm
          mode="login"
          next={next}
          pendingLabel="Accediendo..."
          showForgotLink
          submitLabel="Acceder al campus"
        />
      }
      leftDescription="Ingresa con tu cuenta para continuar tu experiencia educativa, acceder a tus cursos y retomar tu progreso."
      leftTitle="Bienvenido al Campus"
      secondaryCtaHint="¿Aún no tienes cuenta? Regístrate y accede a la formación especializada."
      secondaryCtaHref={
        next ? `/registro?next=${encodeURIComponent(next)}` : "/registro"
      }
      secondaryCtaLabel="Crear cuenta"
      showDemoNotice={showDemoNotice}
      statusMessage={statusMessage}
      statusTone="info"
    />
  );
}
