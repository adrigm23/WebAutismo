import Link from "next/link";
import { BookOpenText, Files, MessageSquareMore } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const campusHighlights = [
  {
    title: "Cursos",
    description:
      "Programas completos con objetivos, modulos y acceso centralizado en tu cuenta.",
    icon: BookOpenText,
  },
  {
    title: "Recursos",
    description:
      "Materiales, tareas y referencias organizadas para seguir cada curso sin perder contexto.",
    icon: Files,
  },
  {
    title: "Comunidad",
    description:
      "Foro privado para resolver dudas y mantener el seguimiento dentro del mismo campus.",
    icon: MessageSquareMore,
  },
] as const;

export function HomeProductShowcase() {
  return (
    <section
      aria-labelledby="home-campus-includes-heading"
      className="relative"
    >
      <div className="ui-card-base space-y-6 p-6 lg:p-7">
        <div className="space-y-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Que incluye el campus
          </p>
          <h2
            className="text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-ink)]"
            id="home-campus-includes-heading"
          >
            Formacion, recursos y seguimiento en un mismo espacio
          </h2>
          <p className="max-w-lg text-sm leading-7 text-[var(--color-muted)]">
            Una vista clara de lo que recibe cada alumno desde el primer acceso,
            sin piezas decorativas que compitan con la decision principal.
          </p>
        </div>

        <div className="grid gap-3">
          {campusHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <Card className="grid gap-3 p-4" key={item.title} variant="muted">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <h3 className="text-base font-semibold text-[var(--color-ink)]">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm leading-7 text-[var(--color-muted)]">
                  {item.description}
                </p>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:items-center">
          <ButtonLink className="justify-center" href="/cursos">
            Ver cursos
          </ButtonLink>
          <Link
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            href="/registro"
          >
            Solicitar acceso
          </Link>
        </div>
      </div>
    </section>
  );
}
