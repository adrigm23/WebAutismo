import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";
import { HomeFeaturedCourseCard } from "@/components/platform/home/home-featured-course-card";
import { HomeHero } from "@/components/platform/home/home-hero";
import { HomeSectionHeader } from "@/components/platform/home/home-section-header";
import {
  homeAudience,
  homePillars,
  homeSteps,
  homeTrustItems
} from "@/components/platform/home/content";
import { ButtonLink } from "@/components/ui/button";
import { getFeaturedCatalogCourses } from "@/lib/course-catalog";
import "@/components/platform/home/home-landing.css";

const pillarIcons = {
  catalog: BookOpen,
  checkout: GraduationCap,
  campus: LockKeyhole
} as const;

export async function HomeLanding() {
  const featuredCourses = await getFeaturedCatalogCourses();

  return (
    <div className="home-landing pb-8">
      <HomeHero />

      <section
        aria-labelledby="home-pillars-heading"
        className="site-container py-16 sm:py-20"
        id="home-pillars"
      >
        <HomeSectionHeader
          align="center"
          description="Una plataforma real de formación: información clara antes de comprar, acceso controlado después de matricularse."
          eyebrow="Por qué esta plataforma"
          headingId="home-pillars-heading"
          title="Todo el recorrido formativo en un solo lugar"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {homePillars.map((pillar) => {
            const Icon = pillarIcons[pillar.icon];
            return (
              <article
                className="rounded-2xl border border-[rgba(12,113,195,0.12)] bg-white p-6 shadow-[var(--shadow-soft)]"
                key={pillar.title}
              >
                <div className="inline-flex rounded-xl bg-[var(--color-primary-soft)] p-3">
                  <Icon aria-hidden className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  {pillar.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="home-courses-heading"
        className="border-y border-[rgba(12,113,195,0.1)] bg-[var(--color-surface-strong)] py-16 sm:py-20"
      >
        <div className="site-container">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <HomeSectionHeader
              description="Fichas con programa, metodología y docente para decidir con confianza."
              eyebrow="Cursos destacados"
              headingId="home-courses-heading"
              title="Catálogo pensado para decidir bien"
            />
            <Link
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] underline-offset-4 transition hover:underline"
              href="/cursos"
            >
              Ver catálogo completo
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <HomeFeaturedCourseCard course={course} key={course.slug} />
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="home-steps-heading"
        className="site-container py-16 sm:py-20"
        id="home-steps"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <HomeSectionHeader
            description="Sin promesas vacías: cada paso corresponde a funcionalidades reales del producto."
            eyebrow="Cómo funciona"
            headingId="home-steps-heading"
            title="Del catálogo al campus en tres pasos"
          />

          <ol className="space-y-4">
            {homeSteps.map((step, index) => (
              <li
                className="flex gap-4 rounded-2xl border border-[rgba(12,113,195,0.12)] bg-white p-5 shadow-[var(--shadow-soft)]"
                key={step.title}
              >
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-[var(--color-ink)]">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-7 text-[var(--color-muted)]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="home-trust-heading"
        className="border-t border-[rgba(12,113,195,0.1)] bg-[var(--color-surface)] py-16 sm:py-20"
      >
        <div className="site-container grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <HomeSectionHeader
              description="La seguridad no es un adorno: condiciona el acceso a materiales, campus y foro."
              eyebrow="Confianza"
              headingId="home-trust-heading"
              title="Contenidos y permisos validados en servidor"
            />
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {homeTrustItems.map((item) => (
              <li
                className="flex items-start gap-3 rounded-xl border border-[rgba(12,113,195,0.1)] bg-white px-4 py-3.5 text-sm leading-6 text-[var(--color-ink)]"
                key={item}
              >
                <ShieldCheck
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="home-cta-heading" className="site-container py-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-[rgba(12,113,195,0.14)] bg-[var(--color-ink)] px-6 py-10 text-white sm:px-10 sm:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(46,163,242,0.22),transparent_42%)]"
          />
          <div className="relative max-w-2xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/70">
              Empieza hoy
            </p>
            <h2
              className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
              id="home-cta-heading"
            >
              Accede a formación especializada con un campus privado y seguro
            </h2>
            <p className="mt-4 text-base leading-7 text-white/78">
              Explora el catálogo, crea tu cuenta y gestiona tus cursos desde un único panel.
              Pensado para {homeAudience.join(", ").toLowerCase()}.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                className="justify-center bg-white text-[var(--color-ink)] hover:bg-white/92 focus-visible:ring-white"
                href="/cursos"
              >
                Explorar cursos
              </ButtonLink>
              <ButtonLink
                className="justify-center border-white/30 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white"
                href="/plataforma"
                variant="secondary"
              >
                Conocer la plataforma
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
