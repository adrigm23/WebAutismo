import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeProductShowcase } from "@/components/platform/home/home-product-showcase";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

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

      <div className="site-container relative grid gap-10 pb-16 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.88fr)] lg:items-start lg:gap-14 lg:pb-24 lg:pt-18">
        <div className="max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            Formacion digital especializada
          </p>

          <h1
            className="mt-5 max-w-4xl text-balance font-display text-[clamp(2.55rem,5.6vw,4.35rem)] font-semibold leading-[0.98] tracking-[-0.06em] text-[var(--color-ink)]"
            id="home-hero-heading"
          >
            Formacion en autismo con campus privado y acceso claro
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-[1.08rem] leading-8 text-[var(--color-muted)]">
            {siteConfig.name} reune catalogo, inscripcion y area de alumno en una sola
            plataforma pensada para familias, profesionales y entidades que necesitan
            informacion fiable y contenidos protegidos.
          </p>

          <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
            Explora cursos completos, decide con criterio y accede al campus sin fricciones
            innecesarias.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink className="min-w-[10.5rem] justify-center" href="/cursos">
              Ver cursos
              <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
            </ButtonLink>
            <Link
              className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline-offset-4 transition hover:underline"
              href="/registro"
            >
              Crear cuenta
            </Link>
          </div>

          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Ya tienes cuenta?{" "}
            <Link
              className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
              href="/acceder"
            >
              Accede al campus
            </Link>
          </p>
        </div>

        <div className="hidden lg:block">
          <HomeProductShowcase />
        </div>
      </div>
    </section>
  );
}
