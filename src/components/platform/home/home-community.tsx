import { BookMarked, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { HomeSectionHeader } from "@/components/platform/home/home-section-header";

const features = [
  {
    icon: BookMarked,
    label: "Debates categorizados por módulos y temáticas."
  },
  {
    icon: ShieldCheck,
    label: "Resolución de dudas por parte del equipo docente."
  },
  {
    icon: Users,
    label: "Networking con profesionales del sector."
  }
];

const mockThread = {
  category: "Módulo 3 · Comunicación funcional",
  title: "Estrategias PECS para alumnos con alta ansiedad",
  replies: [
    {
      author: "Laura M.",
      role: "Maestra EE",
      time: "hace 3 h",
      text: "¿Alguien tiene experiencia adaptando PECS cuando el alumno rechaza manipular las tarjetas físicas?",
    },
    {
      author: "Carlos R.",
      role: "Docente",
      time: "hace 2 h",
      text: "Sí, una opción es introducir primero el tablero digital con la app Proloquo2Go y después ir pasando a físico de forma gradual. En el recurso de esta semana hay un protocolo detallado.",
      isTeacher: true,
    },
    {
      author: "Ana G.",
      role: "PT",
      time: "hace 1 h",
      text: "Muy útil. Yo también uso objetos de referencia como paso previo antes de la imagen. Funciona bien en los primeros pasos del sistema.",
    },
  ]
};

export function HomeCommunity() {
  return (
    <section
      aria-labelledby="home-community-heading"
      className="border-t border-[rgba(12,113,195,0.08)] py-16 sm:py-24"
      id="comunidad"
    >
      <div className="site-container grid gap-12 lg:grid-cols-2 lg:items-start">
        {/* Text column */}
        <div>
          <HomeSectionHeader
            description="Conecta con otros profesionales, comparte experiencias y resuelve dudas en un entorno seguro y moderado por expertos."
            eyebrow="Comunidad profesional activa"
            headingId="home-community-heading"
            title="No aprendes solo"
          />

          <ul className="mt-8 space-y-4">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                  <Icon aria-hidden className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="pt-1 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Forum mockup */}
        <div aria-hidden="true" className="select-none">
          <div className="ui-card-base overflow-hidden">
            {/* Thread header */}
            <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-5 py-4">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                {mockThread.category}
              </p>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {mockThread.title}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[0.65rem] text-[var(--color-muted)]">
                <MessageCircle className="h-3 w-3" />
                <span>{mockThread.replies.length} respuestas</span>
              </div>
            </div>

            {/* Messages */}
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {mockThread.replies.map((reply) => (
                <div
                  key={reply.author}
                  className={`px-5 py-4 ${reply.isTeacher ? "bg-[var(--color-brand-soft)]" : ""}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-surface-muted)] text-[0.6rem] font-bold text-[var(--color-ink-soft)]">
                      {reply.author[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span
                          className={`text-[0.72rem] font-semibold ${reply.isTeacher ? "text-[var(--color-primary)]" : "text-[var(--color-ink)]"}`}
                        >
                          {reply.author}
                        </span>
                        <span className="text-[0.62rem] text-[var(--color-muted)]">
                          · {reply.role}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[0.6rem] text-[var(--color-muted)]">
                      {reply.time}
                    </span>
                  </div>
                  <p className="text-[0.72rem] leading-6 text-[var(--color-ink-soft)]">
                    {reply.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Compose bar */}
            <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-5 py-3">
              <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5">
                <span className="flex-1 text-[0.72rem] text-[var(--color-muted)]">
                  Escribe tu respuesta…
                </span>
                <span className="h-5 w-px bg-[var(--color-border)]" />
                <span className="text-[0.65rem] font-semibold text-[var(--color-primary)]">
                  Enviar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
