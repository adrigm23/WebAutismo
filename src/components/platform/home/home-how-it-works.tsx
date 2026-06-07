import { homeSteps } from "@/components/platform/home/content";
import { HomeSectionHeader } from "@/components/platform/home/home-section-header";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HomeHowItWorks() {
  return (
    <section
      aria-labelledby="home-how-heading"
      className="border-t border-[rgba(12,113,195,0.08)] bg-[linear-gradient(180deg,var(--color-bg-subtle)_0%,#fff_100%)] py-16 sm:py-24"
    >
      <div className="site-container">
        <HomeSectionHeader
          align="center"
          description="En tres pasos simples, desde explorar el catálogo hasta acceder al campus y obtener tu certificado."
          eyebrow="¿Cómo funciona?"
          headingId="home-how-heading"
          title="Empieza en menos de 10 minutos"
        />

        <div className="relative mt-14">
          {/* Connecting line — desktop only */}
          <div
            aria-hidden
            className="absolute left-1/2 top-12 hidden h-px w-[calc(66.6%-6rem)] -translate-x-1/2 bg-[linear-gradient(90deg,rgba(12,113,195,0.15),rgba(12,113,195,0.3),rgba(12,113,195,0.15))] lg:block"
          />

          <ol className="grid gap-8 sm:grid-cols-3">
            {homeSteps.map((step, i) => (
              <li key={step.title} className="relative flex flex-col items-center text-center">
                {/* Step number bubble */}
                <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--color-primary)] bg-white shadow-[0_0_0_5px_rgba(12,113,195,0.08)]">
                  <span className="font-display text-lg font-bold text-[var(--color-primary)]">
                    {i + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="max-w-[18rem] space-y-2.5">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-12 flex justify-center">
          <ButtonLink href="/cursos">
            Explorar cursos
            <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
