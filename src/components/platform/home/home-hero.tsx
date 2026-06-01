import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeProductShowcase } from "@/components/platform/home/home-product-showcase";
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

      <div className="site-container relative grid grid-cols-1 gap-10 pb-16 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.88fr)] lg:items-start lg:gap-14 lg:pb-24 lg:pt-18">
        <div className="max-w-2xl">
          <div className="home-rise inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[rgba(22,60,88,0.15)] bg-[var(--color-brand-soft)] px-3.5 py-1.5 text-[0.72rem] font-semibold tracking-[0.06em] text-[var(--color-primary)]">
            Formación especializada basada en evidencia
          </div>

          <h1
            className="home-rise home-rise-delay-1 mt-4 text-balance font-display text-[clamp(2.2rem,5.6vw,4.35rem)] font-semibold leading-[1.0] tracking-[-0.05em] text-[var(--color-ink)] sm:mt-5 sm:leading-[0.98] sm:tracking-[-0.06em]"
            id="home-hero-heading"
          >
            Aprende a intervenir con personas autistas mediante formación práctica.
          </h1>

          <p className="home-rise home-rise-delay-2 mt-4 text-pretty text-base leading-7 text-[var(--color-muted)] sm:mt-5 sm:text-[1.08rem] sm:leading-8">
            Plataforma educativa diseñada para profesionales, educadores y
            familias que buscan un enfoque actualizado y neuroafirmativo.
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

        {/* Visible on all breakpoints — compact on mobile, full on desktop */}
        <div className="mt-2 sm:mt-0">
          <HomeProductShowcase />
        </div>
      </div>
    </section>
  );
}
