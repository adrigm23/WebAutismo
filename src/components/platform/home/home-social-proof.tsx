import { GraduationCap, Heart, Stethoscope, Users } from "lucide-react";

const items = [
  {
    label: "Centros educativos",
    Icon: GraduationCap,
  },
  {
    label: "Profesionales sanitarios",
    Icon: Stethoscope,
  },
  {
    label: "Asociaciones",
    Icon: Users,
  },
  {
    label: "Familias",
    Icon: Heart,
  },
];

export function HomeSocialProof() {
  return (
    <section
      aria-label="Utilizada por profesionales e instituciones"
      className="border-b border-[rgba(12,113,195,0.08)] bg-white/60 py-8"
    >
      <div className="site-container">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
          <p className="shrink-0 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Utilizada por
          </p>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {items.map(({ label, Icon }) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                  <Icon aria-hidden className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="text-sm font-medium text-[var(--color-ink-soft)]">
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
