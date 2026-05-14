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

export function SplitAuthPanel({
  next,
  emphasis = "login",
  showDemoNotice = false,
  statusMessage = null
}: SplitAuthPanelProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Landmark className="h-7 w-7" />
          </div>
          <p className="text-4xl font-bold tracking-[-0.05em] text-[var(--color-primary)]">
            Autismo Cordoba
          </p>
        </div>

        {statusMessage ? (
          <div className="mb-6 rounded-[24px] border border-[rgba(12,113,195,0.14)] bg-white px-5 py-4 text-sm leading-7 text-[var(--color-ink)] shadow-[0_12px_24px_rgba(34,34,33,0.05)]">
            {statusMessage}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white shadow-[0_20px_45px_rgba(34,34,33,0.06)] lg:grid lg:grid-cols-2">
          <section
            className={cn(
              "p-10 lg:p-12",
              emphasis === "login" ? "bg-white" : "bg-[rgba(255,255,255,0.85)]"
            )}
          >
            <div className="max-w-md">
              <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Inicia sesion
              </h1>
              <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
                Accede a tu panel de aprendizaje y continua tu desarrollo profesional.
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
                  El acceso demo solo esta disponible en entornos locales habilitados por
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
              <h2 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Crea tu cuenta
              </h2>
              <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
                Unete a nuestra comunidad para acceder al catalogo completo de recursos.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-white px-5 py-4 text-sm leading-7 text-[var(--color-muted)]">
              Tu informacion esta protegida mediante encriptacion de nivel institucional. Nunca
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
