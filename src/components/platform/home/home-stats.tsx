import { homeStats } from "@/components/platform/home/content";

export function HomeStats() {
  return (
    <section
      aria-label="Cifras de la plataforma"
      className="border-y border-[rgba(12,113,195,0.09)] bg-[var(--color-bg-subtle)] py-7"
    >
      <div className="site-container">
        <dl className="flex flex-wrap items-center justify-center gap-x-0 gap-y-3 divide-y divide-[rgba(12,113,195,0.1)] sm:divide-y-0">
          {homeStats.map(({ value, label }, i) => (
            <div
              key={label}
              className="flex w-full items-center justify-center gap-3 py-1 sm:w-auto sm:py-0"
            >
              {/* Separator dot between items on desktop */}
              {i > 0 && (
                <span
                  aria-hidden
                  className="hidden h-1 w-1 rounded-full bg-[var(--color-border)] sm:inline-block"
                />
              )}
              <dt className="text-sm font-medium text-[var(--color-muted)]">
                <span className="font-bold text-[var(--color-ink)]">{value}</span>
                {" "}{label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
