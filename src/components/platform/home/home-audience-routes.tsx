import { ArrowRight, GraduationCap, Heart, Stethoscope } from "lucide-react";
import Link from "next/link";
import { homeAudienceRoutes } from "@/components/platform/home/content";
import { HomeSectionHeader } from "@/components/platform/home/home-section-header";

const ICONS = {
  graduation: GraduationCap,
  health: Stethoscope,
  heart: Heart,
} as const;

const ACCENTS = [
  {
    bg: "bg-[rgba(22,60,88,0.05)]",
    iconBg: "bg-[var(--color-brand-soft)]",
    iconText: "text-[var(--color-primary)]",
    tagBg: "bg-[rgba(22,60,88,0.06)] text-[var(--color-primary)]",
    border: "border-[rgba(22,60,88,0.1)] hover:border-[rgba(22,60,88,0.22)]",
  },
  {
    bg: "bg-[rgba(16,120,80,0.04)]",
    iconBg: "bg-[rgba(16,120,80,0.1)]",
    iconText: "text-[#0a7850]",
    tagBg: "bg-[rgba(16,120,80,0.08)] text-[#0a7850]",
    border: "border-[rgba(16,120,80,0.12)] hover:border-[rgba(16,120,80,0.28)]",
  },
  {
    bg: "bg-[rgba(180,60,40,0.04)]",
    iconBg: "bg-[rgba(180,60,40,0.08)]",
    iconText: "text-[#b03c28]",
    tagBg: "bg-[rgba(180,60,40,0.07)] text-[#b03c28]",
    border: "border-[rgba(180,60,40,0.12)] hover:border-[rgba(180,60,40,0.26)]",
  },
];

export function HomeAudienceRoutes() {
  return (
    <section
      aria-labelledby="home-routes-heading"
      className="border-t border-[rgba(12,113,195,0.08)] py-16 sm:py-24"
    >
      <div className="site-container">
        <HomeSectionHeader
          align="center"
          description="Programas diseñados específicamente para tu rol en el acompañamiento y el desarrollo de personas con autismo."
          eyebrow="Rutas de especialización"
          headingId="home-routes-heading"
          title="Formación pensada para ti"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {homeAudienceRoutes.map((route, i) => {
            const Icon = ICONS[route.icon];
            const accent = ACCENTS[i % ACCENTS.length];

            return (
              <Link
                key={route.id}
                href="/cursos"
                className={[
                  "group flex flex-col gap-5 rounded-[var(--radius-xl)] border p-6 transition-all duration-200 hover:shadow-[var(--shadow-soft)] sm:p-7",
                  accent.bg,
                  accent.border,
                ].join(" ")}
              >
                {/* Icon */}
                <span
                  className={[
                    "grid h-11 w-11 place-items-center rounded-[var(--radius-lg)]",
                    accent.iconBg,
                    accent.iconText,
                  ].join(" ")}
                >
                  <Icon aria-hidden className="h-5 w-5" strokeWidth={1.8} />
                </span>

                {/* Text */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                    {route.title}
                  </h3>
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    {route.description}
                  </p>
                </div>

                {/* Tags */}
                <ul className="flex flex-wrap gap-1.5">
                  {route.tags.map((tag) => (
                    <li
                      key={tag}
                      className={[
                        "rounded-[var(--radius-pill)] px-2.5 py-1 text-[0.65rem] font-semibold",
                        accent.tagBg,
                      ].join(" ")}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <p
                  className={[
                    "flex items-center gap-1.5 text-sm font-semibold transition group-hover:gap-2.5",
                    accent.iconText,
                  ].join(" ")}
                >
                  Ver programas
                  <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
