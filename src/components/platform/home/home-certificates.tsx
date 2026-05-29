import { Award, BadgeCheck, Clock, Hash } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { HomeSectionHeader } from "@/components/platform/home/home-section-header";

export function HomeCertificates() {
  return (
    <section
      aria-labelledby="home-certificates-heading"
      className="border-t border-[rgba(12,113,195,0.08)] bg-[var(--color-bg-subtle)] py-16 sm:py-24"
    >
      <div className="site-container grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        {/* Certificate mockup */}
        <div aria-hidden="true" className="order-2 select-none lg:order-1">
          <div className="mx-auto max-w-sm">
            <div
              className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[rgba(22,60,88,0.18)] bg-white p-8 shadow-[var(--shadow-strong)]"
              style={{
                background:
                  "linear-gradient(145deg, #ffffff 0%, #f5f0e8 100%)"
              }}
            >
              {/* Decorative top border */}
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--color-primary),var(--color-secondary),var(--color-accent-warm))]" />

              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Autismo Córdoba
                  </p>
                  <p className="mt-1 text-[0.72rem] font-semibold text-[var(--color-primary)]">
                    Certificado de formación
                  </p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-[var(--color-accent-warm)] text-[var(--color-accent-warm)]">
                  <Award className="h-5 w-5" />
                </span>
              </div>

              {/* Recipient */}
              <p className="mb-1 text-[0.65rem] text-[var(--color-muted)]">
                Se acredita que
              </p>
              <p className="text-xl font-bold tracking-[-0.03em] text-[var(--color-ink)]">
                Laura Martínez García
              </p>
              <p className="mt-1 text-[0.72rem] text-[var(--color-muted)]">
                ha completado satisfactoriamente
              </p>

              {/* Course */}
              <div className="my-5 rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] px-4 py-3">
                <p className="text-sm font-semibold leading-tight text-[var(--color-ink)]">
                  Comunicación funcional en autismo: estrategias de intervención
                </p>
              </div>

              {/* Meta */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[0.65rem] text-[var(--color-muted)]">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>30 horas lectivas</span>
                </div>
                <div className="flex items-center gap-2 text-[0.65rem] text-[var(--color-muted)]">
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--color-success)]" />
                  <span>Competencias adquiridas verificadas</span>
                </div>
                <div className="flex items-center gap-2 text-[0.65rem] text-[var(--color-muted)]">
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono tracking-wide">ACO-2024-CF-00312</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 border-t border-[rgba(22,60,88,0.1)] pt-4">
                <p className="text-[0.6rem] text-[var(--color-muted)]">
                  Emitido el 14 de junio de 2024 · Verificable en autismocordoba.org
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Text column */}
        <div className="order-1 lg:order-2">
          <HomeSectionHeader
            description="Obtén reconocimiento oficial al completar tus formaciones. Cada certificado incluye un código de verificación único y detalla las competencias adquiridas y horas lectivas."
            eyebrow="Certificados avalados"
            headingId="home-certificates-heading"
            title="Tu formación, reconocida"
          />

          <div className="mt-8">
            <ButtonLink href="/plataforma" variant="neutral">
              Saber más sobre acreditaciones
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
