import { HomeSectionHeader } from "@/components/platform/home/home-section-header";
import { homeTestimonials } from "@/components/platform/home/content";

export function HomeTestimonials() {
  return (
    <section
      aria-labelledby="home-testimonials-heading"
      className="border-t border-[rgba(12,113,195,0.08)] py-16 sm:py-24"
    >
      <div className="site-container">
        <HomeSectionHeader
          align="center"
          eyebrow="Lo que dicen los profesionales"
          headingId="home-testimonials-heading"
          title="Confianza de quienes ya están dentro"
        />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {homeTestimonials.map((t) => (
            <li
              key={t.name}
              className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-white p-6 shadow-[var(--shadow-soft)]"
            >
              <blockquote className="flex-1">
                <p className="text-sm leading-7 text-[var(--color-ink-soft)] before:content-['“'] after:content-['”']">
                  {t.quote}
                </p>
              </blockquote>

              <footer className="flex items-center gap-3 border-t border-[var(--color-border-subtle)] pt-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-primary)]">
                  {t.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {t.name}
                  </p>
                  <p className="text-[0.72rem] text-[var(--color-muted)]">
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
