import { homeStats } from "@/components/platform/home/content";

export function HomeStats() {
  return (
    <section
      aria-label="Cifras de la plataforma"
      className="border-y border-[rgba(12,113,195,0.09)] bg-white"
    >
      <div className="site-container py-10 sm:py-12">
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {homeStats.map(({ value, label }, i) => (
            <div
              key={label}
              className={[
                "flex flex-col items-center text-center",
                i < homeStats.length - 1
                  ? "lg:border-r lg:border-[rgba(12,113,195,0.1)]"
                  : "",
              ].join(" ")}
            >
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                {label}
              </dt>
              <dd className="mt-2 font-display text-[2.8rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-primary)] sm:text-[3.2rem]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
