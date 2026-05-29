import { GraduationCap, Heart, Stethoscope, Users } from "lucide-react";

const items = [
  { label: "Centros educativos", Icon: GraduationCap },
  { label: "Profesionales sanitarios", Icon: Stethoscope },
  { label: "Asociaciones", Icon: Users },
  { label: "Familias", Icon: Heart },
];

export function HomeSocialProof() {
  return (
    <section
      aria-label="Utilizada por profesionales e instituciones"
      className="border-b border-[rgba(12,113,195,0.08)] bg-white/60 py-8"
    >
      <div className="site-container">
        <p className="mb-5 text-center text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)] sm:mb-0 sm:text-left">
          Utilizada por
        </p>
        <div className="sm:mt-0 sm:flex sm:items-center sm:gap-10">
          {/* Label visible only on sm+ inline with items */}
          <p className="hidden shrink-0 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)] sm:block">
            Utilizada por
          </p>

          <ul className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3">
            {items.map(({ label, Icon }) => (
              <li
                key={label}
                className="flex min-h-[44px] items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white px-3 py-2 sm:min-h-0 sm:rounded-none sm:border-none sm:bg-transparent sm:p-0"
              >
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
