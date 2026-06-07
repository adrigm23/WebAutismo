import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function HomeHero() {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative overflow-hidden border-b border-[rgba(12,113,195,0.1)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(52rem,85vh)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(246,243,238,0.4)_55%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="home-hero-grid pointer-events-none absolute inset-0 opacity-[0.45]"
      />

      <div className="site-container relative grid grid-cols-1 gap-10 pb-16 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.9fr)] lg:items-center lg:gap-14 lg:pb-24 lg:pt-20">
        {/* Text column */}
        <div className="max-w-2xl">
          <div className="home-rise inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[rgba(22,60,88,0.15)] bg-[var(--color-brand-soft)] px-3.5 py-1.5 text-[0.72rem] font-semibold tracking-[0.06em] text-[var(--color-primary)]">
            Formación especializada basada en evidencia
          </div>

          <h1
            className="home-rise home-rise-delay-1 mt-4 text-balance font-display text-[clamp(2.2rem,5.6vw,4.35rem)] font-semibold leading-[1.0] tracking-[-0.05em] text-[var(--color-ink)] sm:mt-5 sm:leading-[0.98] sm:tracking-[-0.06em]"
            id="home-hero-heading"
          >
            Formación Profesional Especializada en Autismo
          </h1>

          <p className="home-rise home-rise-delay-2 mt-4 text-pretty text-base leading-7 text-[var(--color-muted)] sm:mt-5 sm:text-[1.08rem] sm:leading-8">
            Desarrolla competencias prácticas basadas en evidencia. Un entorno
            de aprendizaje estructurado, calmado y enfocado en mejorar la
            calidad de vida de las personas neurodivergentes.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink className="w-full justify-center sm:w-auto sm:min-w-[10.5rem]" href="/cursos">
              Explorar cursos
              <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
            </ButtonLink>
            <ButtonLink className="w-full justify-center sm:w-auto" href="/plataforma" variant="neutral">
              Ver la plataforma
            </ButtonLink>
          </div>

          <p className="mt-4 text-sm text-[var(--color-muted)]">
            ¿Ya tienes cuenta?{" "}
            <Link
              className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              href="/acceder"
            >
              Accede al campus
            </Link>
          </p>
        </div>

        {/* Image column — placeholder until client provides photo */}
        <div className="home-rise home-rise-delay-2 mt-2 sm:mt-0">
          <div className="overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-strong)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Formación especializada en autismo"
              className="h-[22rem] w-full object-cover lg:h-[28rem]"
              src="/hero-image.jpg"
              onError={(e) => {
                // Fallback decorative placeholder if image not yet provided
                const target = e.currentTarget;
                target.style.display = "none";
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = "flex";
              }}
            />
            {/* Decorative placeholder shown if /hero-image.jpg doesn't exist yet */}
            <div
              aria-hidden
              className="hidden h-[22rem] w-full items-center justify-center bg-[linear-gradient(135deg,rgba(22,60,88,0.08)_0%,rgba(22,60,88,0.18)_100%)] lg:h-[28rem]"
              style={{ display: "none" }}
            >
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-[var(--color-brand-soft)] flex items-center justify-center">
                  <svg className="h-8 w-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm text-[var(--color-muted)]">Imagen del hero</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
