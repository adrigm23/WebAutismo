import type { ReactNode } from "react";
import Link from "next/link";
import { CircleHelp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type AuthShellFrameProps = {
  children: ReactNode;
  className?: string;
};

export function AuthShellFrame({ children, className }: AuthShellFrameProps) {
  return (
    <main
      className={cn(
        "campus-calm-bg h-[100dvh] overflow-hidden px-5 py-8 sm:px-6 sm:py-10 lg:px-8",
        className,
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col">{children}</div>
    </main>
  );
}

export function AuthBrand({
  align = "left",
  subtitle = "Campus neuro-inclusivo",
}: {
  align?: "left" | "center";
  subtitle?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        align === "center" && "justify-center",
      )}
    >
      <BrandLogo size="md" />
      <div className={cn("min-w-0", align === "center" && "text-center")}>
        <p className="font-premium text-heading-md font-semibold text-[var(--color-text)]">
          Autismo Cordoba
        </p>
        <p className="text-label-sm text-[var(--color-text-muted)]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export function AuthSupportLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[var(--color-text-muted)]">
      <Link
        className="transition hover:text-[var(--color-primary)]"
        href="/soporte"
      >
        Ayuda y soporte
      </Link>
      <Link
        className="transition hover:text-[var(--color-primary)]"
        href="/legal"
      >
        Aviso legal
      </Link>
      <a
        className="transition hover:text-[var(--color-primary)]"
        href={`mailto:${siteConfig.supportEmail}`}
      >
        {siteConfig.supportEmail}
      </a>
    </div>
  );
}

type AuthSplitShellProps = {
  statusMessage?: string | null;
  statusTone?: "info" | "success" | "warning" | "danger";
  leftTitle: string;
  leftDescription: string;
  leftContent: ReactNode;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHint: string;
  showDemoNotice?: boolean;
};

export function AuthSplitShell({
  statusMessage,
  statusTone = "info",
  leftTitle,
  leftDescription,
  leftContent,
  secondaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHint,
  showDemoNotice = false,
}: AuthSplitShellProps) {
  return (
    <AuthShellFrame>
      <div className="grid flex-1 gap-6 overflow-hidden lg:grid-cols-[minmax(0,1.03fr)_minmax(21rem,0.97fr)] lg:gap-0">
        <section className="flex flex-col justify-between overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:rounded-r-none lg:border-r-0 lg:p-10 xl:p-12">
          <div>
            <AuthBrand />

            {statusMessage ? (
              <StateBanner
                className="mt-8"
                description={statusMessage}
                tone={statusTone}
              />
            ) : null}

            <div className="mt-10 max-w-xl">
              <h1 className="font-premium text-display-xl font-semibold text-[var(--color-text)]">
                {leftTitle}
              </h1>
              <p className="mt-4 max-w-[34rem] text-body-lg text-[var(--color-text-muted)]">
                {leftDescription}
              </p>
            </div>

            <div className="mt-10 max-w-xl">{leftContent}</div>
          </div>

          <div className="mt-10 border-t border-[var(--color-border-subtle)] pt-6">
            <p className="text-label-sm font-medium text-[var(--color-text-muted)]">
              {secondaryCtaHint}
            </p>
            <ButtonLink
              className="mt-4"
              href={secondaryCtaHref}
              variant="neutral"
            >
              {secondaryCtaLabel}
            </ButtonLink>
          </div>
        </section>

        <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-primary-strong)_100%)] p-6 text-[var(--color-text-inverse)] shadow-[var(--shadow-sm)] sm:p-8 lg:rounded-l-none lg:p-10 xl:p-12">
          <div className="flex flex-col">
            <div>
              <Badge
                className="bg-white/12 text-white"
                shape="pill"
                size="md"
                tone="outline"
              >
                Acceso institucional
              </Badge>
              <h2 className="mt-8 font-premium text-display-lg font-semibold tracking-[-0.05em] text-white">
                Acompanando cada etapa del desarrollo.
              </h2>
              <p className="mt-5 max-w-[30rem] text-body-md text-white/76">
                Un espacio disenado para ofrecer formacion, recursos y
                acompanamiento con una experiencia clara, serena y accesible.
              </p>
            </div>

            <div className="mt-10 grid gap-4">
              <div className="rounded-[var(--radius-xl)] border border-white/12 bg-white/10 p-5 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-white/20">
                    <ShieldCheck
                      className="size-5 text-white"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Acceso vinculado a tu cuenta
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/70">
                      Cada matricula, progreso y recurso queda asociado a tu
                      perfil institucional.
                    </p>
                  </div>
                </div>
              </div>

              {showDemoNotice ? (
                <StateBanner
                  className="border-white/14 bg-white/10 text-white"
                  description="Modo demo habilitado solo para entornos locales configurados. Las credenciales no se exponen en esta interfaz."
                  icon={
                    <CircleHelp className="size-4 text-white" strokeWidth={2} />
                  }
                  title="Entorno de validacion"
                  tone="info"
                />
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </AuthShellFrame>
  );
}

type AuthCenteredShellProps = {
  eyebrow?: ReactNode;
  title: string;
  description: string;
  content: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "success" | "danger";
  status?: ReactNode;
};

export function AuthCenteredShell({
  eyebrow = "Seguridad de cuenta",
  title,
  description,
  content,
  footer,
  tone = "default",
  status,
}: AuthCenteredShellProps) {
  return (
    <AuthShellFrame className="flex items-center">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <AuthBrand align="center" subtitle="Plataforma profesional" />

        {status ? <div className="mt-8 w-full">{status}</div> : null}

        <SurfaceCard
          className={cn(
            "mt-8 w-full",
            tone === "success" && "border-[var(--color-success)]/18",
            tone === "danger" && "border-[var(--color-danger)]/18",
          )}
          padding="lg"
        >
          <div className="mx-auto max-w-[34rem]">
            <div className="text-center">
              <p className="text-meta-xs font-semibold text-[var(--color-primary)]">
                {eyebrow}
              </p>
              <h1 className="mt-3 font-premium text-display-lg font-semibold text-[var(--color-text)]">
                {title}
              </h1>
              <p className="mt-4 text-body-md text-[var(--color-text-muted)]">
                {description}
              </p>
            </div>

            <div className="mt-8">{content}</div>
          </div>
        </SurfaceCard>

        {footer ? (
          <div className="mt-8 w-full max-w-xl text-center">{footer}</div>
        ) : null}

        <div className="mt-8">
          <AuthSupportLinks />
        </div>
      </div>
    </AuthShellFrame>
  );
}
