import { GraduationCap, Heart, Stethoscope, Users } from "lucide-react";

const audiences = [
  { label: "Centros educativos", Icon: GraduationCap },
  { label: "Profesionales sanitarios", Icon: Stethoscope },
  { label: "Asociaciones y entidades", Icon: Users },
  { label: "Familias", Icon: Heart },
];

export function HomeSocialProof() {
  return (
    <section
      aria-label="Quiénes utilizan la plataforma"
      className="border-b border-[rgba(12,113,195,0.08)] bg-white py-6"
    >
      <div className="site-container">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          <p className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Utilizada por
          </p>

          <ul className="flex flex-wrap justify-center gap-3 sm:justify-start">
            {audiences.map(({ label, Icon }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-3.5 py-2"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                  <Icon aria-hidden className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
                <span className="text-[0.78rem] font-medium text-[var(--color-ink-soft)]">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
