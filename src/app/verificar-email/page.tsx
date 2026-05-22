import type { Metadata } from "next";
import { CircleCheckBig, CircleX } from "lucide-react";
import { AuthCenteredShell } from "@/components/auth/auth-shells";
import { ButtonLink } from "@/components/ui/button";
import { StateBanner } from "@/components/ui/state-banner";
import { consumeEmailVerificationToken } from "@/lib/account-security";

export const metadata: Metadata = {
  title: "Verificar email",
  robots: {
    index: false,
    follow: false,
  },
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const token = firstValue((await searchParams).token)?.trim() ?? "";
  const verifiedUser = token
    ? await consumeEmailVerificationToken(token)
    : null;

  return (
    <AuthCenteredShell
      content={
        <div className="flex flex-col gap-5">
          <StateBanner
            description={
              verifiedUser
                ? "La direccion de correo ya ha quedado validada. Ahora puedes acceder al campus con normalidad."
                : "El enlace no es valido, ya se ha utilizado o ha caducado. Solicita una nueva verificacion desde tu cuenta."
            }
            icon={
              verifiedUser ? (
                <CircleCheckBig
                  className="size-4 text-[var(--color-success)]"
                  strokeWidth={2}
                />
              ) : (
                <CircleX
                  className="size-4 text-[var(--color-danger)]"
                  strokeWidth={2}
                />
              )
            }
            tone={verifiedUser ? "success" : "danger"}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href="/acceder">Ir a acceso</ButtonLink>
            <ButtonLink href="/soporte" variant="neutral">
              Contactar soporte
            </ButtonLink>
          </div>
        </div>
      }
      description={
        verifiedUser
          ? "Tu cuenta ya esta preparada para entrar en el campus."
          : "Necesitamos un enlace valido para completar la verificacion de tu cuenta."
      }
      title={
        verifiedUser
          ? "Correo verificado"
          : "No hemos podido verificar el correo"
      }
      tone={verifiedUser ? "success" : "danger"}
    />
  );
}
