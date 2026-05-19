import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeFeaturedCourseCard } from "@/components/platform/home/home-featured-course-card";
import { HomeHero } from "@/components/platform/home/home-hero";
import { HomeSectionHeader } from "@/components/platform/home/home-section-header";
import {
  homeAudience,
  homeSteps,
  homeTrustItems
} from "@/components/platform/home/content";
import { ButtonLink } from "@/components/ui/button";
import { getFeaturedCatalogCourses } from "@/lib/course-catalog";
import "@/components/platform/home/home-landing.css";

export async function HomeLanding() {
  const featuredCourses = await getFeaturedCatalogCourses();

  return (
    <div className="home-landing pb-8">
      <HomeHero />

      <section
        aria-labelledby="home-courses-heading"
        className="border-t border-[rgba(12,113,195,0.08)] py-16 sm:py-20"
      >
        <div className="site-container">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <HomeSectionHeader
              description="Cursos claros, con programa, metodologia y docente visibles antes de decidir."
              eyebrow="Cursos destacados"
              headingId="home-courses-heading"
              title="Explora el catalogo"
            />
            <Link
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] underline-offset-4 transition hover:underline"
              href="/cursos"
            >
              Ver catalogo completo
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {featuredCourses.map((course, index) => (
              <div className={index > 1 ? "hidden lg:block" : undefined} key={course.slug}>
                <HomeFeaturedCourseCard course={course} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="home-flow-heading"
        className="border-t border-[rgba(12,113,195,0.08)] py-16 sm:py-20"
        id="home-steps"
      >
        <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start">
          <div>
            <HomeSectionHeader
              description="Del catalogo al campus, el recorrido mantiene una sola idea: entender bien el curso antes de entrar."
              eyebrow="Como funciona"
              headingId="home-flow-heading"
              title="Una entrada mas clara al aprendizaje"
            />

            <p className="mt-8 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
              {homeTrustItems[0]}. {homeTrustItems[1]}. {homeTrustItems[2]}.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
              Pensado para {homeAudience.join(", ").toLowerCase()}.
            </p>
          </div>

          <div className="divide-y divide-[rgba(12,113,195,0.12)] border-y border-[rgba(12,113,195,0.12)]">
            {homeSteps.map((step, index) => (
              <article className="grid gap-3 py-6 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-5" key={step.title}>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                  Paso {index + 1}
                </p>
                <div>
                  <h3 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    {step.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="home-cta-heading" className="site-container py-16 sm:pb-24">
        <div className="border-t border-[rgba(12,113,195,0.12)] pt-10">
          <div className="max-w-2xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
              Empieza hoy
            </p>
            <h2
              className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)] sm:text-4xl"
              id="home-cta-heading"
            >
              Explora la formacion y entra al campus con una sola cuenta
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
              La home termina donde debe: en una decision clara para seguir viendo cursos.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink className="justify-center" href="/cursos">
                Ver cursos
              </ButtonLink>
              <Link
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline-offset-4 transition hover:underline"
                href="/plataforma"
              >
                Conocer la plataforma
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
