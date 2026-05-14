import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SplitAuthPanel } from "@/components/auth/split-auth-panel";
import { getCurrentUser } from "@/lib/auth";
import { isDemoAuthEnabled } from "@/lib/env";
import { getSafeRedirect } from "@/lib/redirect";
import { firstValue } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Acceder",
  robots: {
    index: false,
    follow: false
  }
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    verify?: string | string[];
    reset?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const { next, verify, reset } = await searchParams;
  const safeNext = getSafeRedirect(firstValue(next), "/mi-cuenta");
  const showVerificationMessage = firstValue(verify) === "1";
  const showResetMessage = firstValue(reset) === "1";

  if (user) {
    redirect(safeNext);
  }

  return (
    <SplitAuthPanel
      emphasis="login"
      next={safeNext}
      showDemoNotice={isDemoAuthEnabled()}
      statusMessage={
        showVerificationMessage
          ? "Tu cuenta se ha creado. Revisa tu correo y verifica tu direccion antes de acceder."
          : showResetMessage
            ? "Tu contrasena se ha actualizado. Ya puedes iniciar sesion con la nueva clave."
            : null
      }
    />
  );
}
