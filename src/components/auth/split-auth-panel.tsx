"use client";

import Link from "next/link";
import { Landmark } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type SplitAuthPanelProps = {
  next?: string;
  emphasis?: "login" | "register";
  showDemoNotice?: boolean;
  statusMessage?: string | null;
};

function buildAuthHref(path: "/acceder" | "/registro", next?: string) {
  if (!next) {
    return path;
  }

  const params = new URLSearchParams({ next });
  return `${path}?${params.toString()}`;
}

export function SplitAuthPanel({
  next,
  emphasis = "login",
  showDemoNotice = false,
  statusMessage = null
}: SplitAuthPanelProps) {
  const isLoginPrimary = emphasis === "login";
  const alternateHref = buildAuthHref(isLoginPrimary ? "/registro" : "/acceder", next);
  const LoginHeading = emphasis === "login" ? "h1" : "h2";
  const RegisterHeading = emphasis === "register" ? "h1" : "h2";

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-5 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center sm:mb-10">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] sm:h-14 sm:w-14">
            <Landmark className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <p className="text-3xl font-bold tracking-[-0.05em] text-[var(--color-primary)] sm:text-4xl">
            Autismo Córdoba
          </p>
        </div>

        {statusMessage ? (
          <div className="mb-6 rounded-[24px] border border-[rgba(12,113,195,0.14)] bg-white px-5 py-4 text-sm leading-7 text-[var(--color-ink)] shadow-[0_12px_24px_rgba(34,34,33,0.05)]">
            {statusMessage}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white shadow-[0_20px_45px_rgba(34,34,33,0.06)] lg:hidden">
          {isLoginPrimary ? (
            <section className="p-6 sm:p-8">
              <div className="max-w-md">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] sm:text-5xl">
                  Inicia sesión
                </h1>
                <p className="mt-3 text-base leading-7 text-[var(--color-muted)] sm:text-lg sm:leading-8">
                  Accede a tu panel y retoma tu formación.
                </p>
              </div>

              <AuthForm
                className="mt-8"
                mode="login"
                next={next}
                pendingLabel="Accediendo..."
                showForgotLink
                submitLabel="Acceder"
              />

              {showDemoNotice ? (
                <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-sm leading-7 text-[var(--color-muted)]">
                  <p className="font-semibold text-[var(--color-ink)]">Modo demo habilitado</p>
                  <p>Disponible solo en entornos locales configurados.</p>
                </div>
              ) : null}
            </section>
          ) : (
            <section className="p-6 sm:p-8">
              <div className="max-w-md">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] sm:text-5xl">
                  Crea tu cuenta
                </h1>
                <p className="mt-3 text-base leading-7 text-[var(--color-muted)] sm:text-lg sm:leading-8">
                  Regístrate para acceder al campus completo.
                </p>
              </div>

              <AuthForm
                className="mt-8"
                mode="register"
                next={next}
                pendingLabel="Creando cuenta..."
                submitLabel="Inscribirse"
              />
            </section>
          )}

          <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5 sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
              {isLoginPrimary ? "¿Primera vez aquí?" : "¿Ya tienes cuenta?"}
            </p>
            <div className="mt-3 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                {isLoginPrimary
                  ? "Crea tu cuenta en un paso y entra al campus."
                  : "Accede con tu correo y continúa tu actividad."}
              </p>
              <Link
                className="shrink-0 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                href={alternateHref}
              >
                {isLoginPrimary ? "Ir a registro" : "Ir a acceder"}
              </Link>
            </div>
          </section>
        </div>

        <div className="hidden overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white shadow-[0_20px_45px_rgba(34,34,33,0.06)] lg:grid lg:grid-cols-2">
          <section
            className={cn(
              "p-10 lg:p-12",
              emphasis === "login" ? "bg-white" : "bg-[rgba(255,255,255,0.85)]"
            )}
          >
            <div className="max-w-md">
              <LoginHeading className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Inicia sesión
              </LoginHeading>
              <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
                Accede a tu panel de aprendizaje y continúa tu desarrollo profesional.
              </p>
            </div>

            <AuthForm
              className="mt-12"
              mode="login"
              next={next}
              pendingLabel="Accediendo..."
              showForgotLink
              submitLabel="Acceder"
            />

            {showDemoNotice ? (
              <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-sm leading-7 text-[var(--color-muted)]">
                <p className="font-semibold text-[var(--color-ink)]">Modo demo habilitado</p>
                <p>
                  El acceso demo solo está disponible en entornos locales habilitados por
                  variables de entorno. Las credenciales no se exponen en la interfaz.
                </p>
              </div>
            ) : null}
          </section>

          <section
            className={cn(
              "border-t border-[var(--color-border)] bg-[var(--color-surface)] p-10 lg:border-l lg:border-t-0 lg:p-12",
              emphasis === "register" ? "bg-[var(--color-surface)]" : "bg-[rgba(241,238,234,0.8)]"
            )}
          >
            <div className="max-w-md">
              <RegisterHeading className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Crea tu cuenta
              </RegisterHeading>
              <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
                Únete a nuestra comunidad para acceder al catálogo completo de recursos.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-white px-5 py-4 text-sm leading-7 text-[var(--color-muted)]">
              Tu información está protegida mediante encriptación de nivel institucional. Nunca
              compartiremos tus datos personales.
            </div>

            <AuthForm
              className="mt-8"
              mode="register"
              next={next}
              pendingLabel="Creando cuenta..."
              submitLabel="Inscribirse"
            />
          </section>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--color-muted)]">
          <Link className="transition hover:text-[var(--color-primary)]" href="/soporte">
            Ayuda y soporte
          </Link>
          <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
          <Link className="transition hover:text-[var(--color-primary)]" href="/legal">
            Aviso legal
          </Link>
          <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
          <a
            className="transition hover:text-[var(--color-primary)]"
            href={`mailto:${siteConfig.supportEmail}`}
          >
            {siteConfig.supportEmail}
          </a>
        </div>
      </div>
    </div>
  );
}
