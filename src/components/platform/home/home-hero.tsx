import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { HomeProductShowcase } from "@/components/platform/home/home-product-showcase";
import { ButtonLink } from "@/components/ui/button";
import { homeAudience } from "@/components/platform/home/content";
import { siteConfig } from "@/lib/site";

const heroSignals = [
  { label: "Campus privado por curso" },
  { label: "Matrícula y permisos en servidor" },
  { label: "Foro y materiales protegidos" }
];

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

      <div className="site-container relative grid gap-14 pb-20 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16 lg:pb-28 lg:pt-20">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(12,113,195,0.16)] bg-white/90 px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            Formación digital especializada
          </p>

          <h1
            className="mt-6 text-balance font-display text-[clamp(2.35rem,5vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.05em] text-[var(--color-ink)]"
            id="home-hero-heading"
          >
            Formación en autismo con campus privado y acceso claro
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-lg leading-8 text-[var(--color-muted)]">
            {siteConfig.name} reúne catálogo, inscripción y área de alumno en una sola
            plataforma pensada para familias, profesionales y entidades que necesitan
            información fiable y contenidos protegidos.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink className="min-w-[10.5rem] justify-center" href="/cursos">
              Ver cursos
              <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
            </ButtonLink>
            <ButtonLink className="min-w-[10.5rem] justify-center" href="/registro" variant="secondary">
              Crear cuenta
            </ButtonLink>
          </div>

          <p className="mt-4 text-sm text-[var(--color-muted)]">
            ¿Ya tienes cuenta?{" "}
            <Link
              className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
              href="/acceder"
            >
              Accede al campus
            </Link>
          </p>

          <ul className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {heroSignals.map((signal) => (
              <li
                className="flex items-center gap-2 text-sm text-[var(--color-ink)]"
                key={signal.label}
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]"
                />
                {signal.label}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-2">
            {homeAudience.map((audience) => (
              <span
                className="rounded-md border border-[rgba(12,113,195,0.14)] bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--color-muted)]"
                key={audience}
              >
                {audience}
              </span>
            ))}
          </div>
        </div>

        <HomeProductShowcase />
      </div>
    </section>
  );
}
