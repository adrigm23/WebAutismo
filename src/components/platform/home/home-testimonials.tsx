import { HomeSectionHeader } from "@/components/platform/home/home-section-header";
import { homeTestimonials } from "@/components/platform/home/content";

export function HomeTestimonials() {
  return (
    <section
      aria-labelledby="home-testimonials-heading"
      className="border-t border-[rgba(12,113,195,0.08)] bg-[linear-gradient(180deg,#f7f4ef_0%,#fff_100%)] py-16 sm:py-24"
    >
      <div className="site-container">
        <HomeSectionHeader
          align="center"
          description="Profesionales, educadores y familias que ya han completado su formación en la plataforma."
          eyebrow="Lo que dicen los profesionales"
          headingId="home-testimonials-heading"
          title="Confianza de quienes ya están dentro"
        />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {homeTestimonials.map((t) => (
            <li
              key={t.name}
              className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-white p-6 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-medium)] sm:p-7"
            >
              {/* Quote mark */}
              <span
                aria-hidden
                className="font-display text-[3.5rem] leading-none text-[var(--color-primary)] opacity-20 select-none"
              >
                {'"'}
              </span>

              <blockquote className="-mt-6 flex-1">
                <p className="text-[0.95rem] leading-[1.75] text-[var(--color-ink-soft)]">
                  {t.quote}
                </p>
              </blockquote>

              <footer className="flex items-center gap-3 border-t border-[var(--color-border-subtle)] pt-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white shadow-[var(--shadow-soft)]">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {t.name}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] text-[var(--color-muted)]">
                    {t.role} · {t.detail}
                  </p>
                </div>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
