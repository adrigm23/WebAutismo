import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeCampusInside } from "@/components/platform/home/home-campus-inside";
import { HomeCertificates } from "@/components/platform/home/home-certificates";
import { HomeCommunity } from "@/components/platform/home/home-community";
import { HomeFeaturedCourseCard } from "@/components/platform/home/home-featured-course-card";
import { HomeHero } from "@/components/platform/home/home-hero";
import { HomeStats } from "@/components/platform/home/home-stats";
import { HomeAudienceRoutes } from "@/components/platform/home/home-audience-routes";
import { HomeHowItWorks } from "@/components/platform/home/home-how-it-works";
import { HomeSectionHeader } from "@/components/platform/home/home-section-header";
import { HomeSocialProof } from "@/components/platform/home/home-social-proof";
import { HomeTestimonials } from "@/components/platform/home/home-testimonials";
import { ButtonLink } from "@/components/ui/button";
import { getFeaturedCatalogCourses } from "@/lib/course-catalog";
import "@/components/platform/home/home-landing.css";

export async function HomeLanding() {
  const featuredCourses = await getFeaturedCatalogCourses();

  return (
    <div className="home-landing pb-8">
      {/* 1. Hero */}
      <HomeHero />

      {/* 2. Social proof — quién la usa */}
      <HomeSocialProof />

      {/* 3. Stats numéricas */}
      <HomeStats />

      {/* 4. Rutas de especialización — segmentación por audiencia */}
      <HomeAudienceRoutes />

      {/* 5. ¿Cómo funciona? — convencer antes de mostrar el precio */}
      <HomeHowItWorks />

      {/* 6. Campus por dentro — demostración del producto */}
      <HomeCampusInside />

      {/* 7. Cursos destacados — ahora el usuario ya confía */}
      <section
        aria-labelledby="home-courses-heading"
        className="border-t border-[rgba(12,113,195,0.08)] py-16 sm:py-20"
      >
        <div className="site-container">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <HomeSectionHeader
              description="Programas completos con objetivos, metodología y docente visibles antes de decidir."
              eyebrow="Formaciones disponibles"
              headingId="home-courses-heading"
              title="Explora el catálogo"
            />
            <Link
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              href="/cursos"
            >
              Ver catálogo completo
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

      {/* 8. Comunidad */}
      <HomeCommunity />

      {/* 9. Certificados — cierre de objeciones */}
      <HomeCertificates />

      {/* 10. Testimonios — prueba social antes del CTA final */}
      <HomeTestimonials />

      {/* 11. CTA final */}
      <section
        aria-labelledby="home-cta-heading"
        className="site-container py-14 sm:pb-24"
      >
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-brand-strong)_100%)] px-6 py-14 text-center sm:px-12">
          {/* Decorative circles */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-[0.04]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white opacity-[0.04]"
          />

          <p className="relative text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[rgba(255,255,255,0.65)]">
            Empieza hoy
          </p>
          <h2
            className="relative mt-3 text-balance text-2xl font-semibold tracking-[-0.04em] text-white sm:text-4xl"
            id="home-cta-heading"
          >
            Tu formación especializada en autismo
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-base leading-7 text-[rgba(255,255,255,0.75)]">
            Accede a cursos, recursos, comunidad y certificados diseñados
            para profesionales, educadores y familias.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink
              className="w-full justify-center sm:w-auto sm:min-w-[11rem]"
              href="/cursos"
              variant="inverse"
            >
              Explorar cursos
              <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
            </ButtonLink>
            <ButtonLink
              className="w-full justify-center sm:w-auto [--button-fg:white] [--button-fg-hover:white] border-white/30 bg-white/10 hover:bg-white/20"
              href="/registro"
              variant="neutral"
            >
              Crear cuenta gratis
            </ButtonLink>
          </div>
          <p className="relative mt-5 text-[0.75rem] text-[rgba(255,255,255,0.5)]">
            Sin compromisos · Acceso inmediato al campus
          </p>
        </div>
      </section>
    </div>
  );
}
