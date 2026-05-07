"use client";

import { Landmark } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { cn } from "@/lib/utils";

type SplitAuthPanelProps = {
  next?: string;
  emphasis?: "login" | "register";
};

export function SplitAuthPanel({
  next,
  emphasis = "login"
}: SplitAuthPanelProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Landmark className="h-7 w-7" />
          </div>
          <p className="text-4xl font-bold tracking-[-0.05em] text-[var(--color-primary)]">
            Autismo Córdoba
          </p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white shadow-[0_20px_45px_rgba(34,34,33,0.06)] lg:grid lg:grid-cols-2">
          <section
            className={cn(
              "p-10 lg:p-12",
              emphasis === "login" ? "bg-white" : "bg-[rgba(255,255,255,0.85)]"
            )}
          >
            <div className="max-w-md">
              <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Inicia sesión
              </h1>
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

            <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-sm leading-7 text-[var(--color-muted)]">
              <p className="font-semibold text-[var(--color-ink)]">Acceso demo temporal</p>
              <p>Admin: admin.demo@autismo.local</p>
              <p>Docente: docente.demo@autismo.local</p>
              <p>Alumno: alumno.demo@autismo.local</p>
              <p>Contrasena: demo12345</p>
            </div>
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
          <span>Ayuda y Soporte</span>
          <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
          <span>Aviso Legal</span>
        </div>
      </div>
    </div>
  );
}
