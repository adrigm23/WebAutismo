import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { HomeSectionHeader } from "@/components/platform/home/home-section-header";
import { homeCampusCallouts } from "@/components/platform/home/content";

const mockModules = [
  { title: "Introducción al TEA y diagnóstico diferencial", done: true },
  { title: "Intervención conductual positiva (ABA)", done: true },
  { title: "Comunicación aumentativa y alternativa", active: true, done: false },
  { title: "Estructuración del entorno escolar", done: false },
  { title: "Habilidades sociales y ocio inclusivo", done: false },
];

const mockResources = [
  { title: "Protocolo de evaluación funcional", pages: "24 págs." },
  { title: "Fichas de apoyo visual PECS", pages: "18 págs." },
  { title: "Guía para familias: rutinas adaptadas", pages: "12 págs." },
];

const mockMessages = [
  {
    author: "Laura M.",
    time: "hace 2 h",
    text: "¿Tenéis ejemplos prácticos de apoyo visual para el patio?",
  },
  {
    author: "Docente · Carlos R.",
    time: "hace 1 h",
    text: "En el recurso de la semana 3 encontrarás fichas PECS adaptadas. También puedes…",
    isTeacher: true,
  },
];

export function HomeCampusInside() {
  return (
    <section
      aria-labelledby="home-campus-inside-heading"
      className="border-t border-[rgba(12,113,195,0.08)] py-16 sm:py-24"
    >
      <div className="site-container">
        <HomeSectionHeader
          align="center"
          description="Un espacio organizado por módulos, con recursos descargables, seguimiento del progreso y foro privado por curso."
          eyebrow="Así es el campus por dentro"
          headingId="home-campus-inside-heading"
          title="Todo lo que necesitas en un solo lugar"
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:items-start">
          {/* Callouts */}
          <ul className="space-y-5">
            {homeCampusCallouts.map((item, i) => (
              <li
                key={item.label}
                className="flex gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-white p-5 shadow-[var(--shadow-soft)]"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)] text-sm font-bold">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Campus mockup */}
          <div aria-hidden="true" className="select-none">
            <div className="ui-card-base overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_srgb,var(--color-danger-soft)_70%,var(--color-danger)_30%)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_srgb,var(--color-warning-soft)_70%,var(--color-accent-warm)_30%)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_srgb,var(--color-success-soft)_70%,var(--color-success)_30%)]" />
                </div>
                <span className="flex-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-3 py-1 text-[0.68rem] text-[var(--color-muted)]">
                  campus.autismocordoba.org/mis-cursos/comunicacion-funcional
                </span>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-4">
                {["Materiales", "Ejercicios", "Comunidad", "Seguimiento"].map(
                  (tab, i) => (
                    <button
                      key={tab}
                      type="button"
                      className={`px-3.5 py-3 text-[0.72rem] font-medium transition ${
                        i === 0
                          ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                          : "text-[var(--color-muted)]"
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>

              {/* Body */}
              <div className="grid gap-4 p-5 sm:grid-cols-[11rem_1fr]">
                {/* Module list */}
                <div>
                  <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Módulos
                  </p>
                  <div className="space-y-0.5">
                    {mockModules.map((m) => (
                      <div
                        key={m.title}
                        className={`flex items-start gap-1.5 rounded-[var(--radius-xs)] px-2 py-1.5 text-[0.68rem] leading-tight ${
                          m.active
                            ? "bg-[var(--color-brand-soft)] font-semibold text-[var(--color-primary)]"
                            : "text-[var(--color-ink-soft)]"
                        }`}
                      >
                        {m.done ? (
                          <CheckCircle2 className="mt-px h-3 w-3 shrink-0 text-[var(--color-success)]" />
                        ) : m.active ? (
                          <ChevronRight className="mt-px h-3 w-3 shrink-0" />
                        ) : (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-[var(--color-border)]" />
                        )}
                        <span>{m.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content area */}
                <div className="space-y-4">
                  {/* Progress */}
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-[var(--color-success)]" />
                      <span className="text-[0.68rem] font-semibold text-[var(--color-ink)]">
                        Progreso: 52%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                      <div className="h-full w-[52%] rounded-full bg-[var(--color-primary)]" />
                    </div>
                  </div>

                  {/* Active module */}
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                      <span className="text-[0.68rem] font-semibold text-[var(--color-ink)]">
                        Comunicación funcional en autismo
                      </span>
                    </div>
                    <p className="text-[0.65rem] leading-5 text-[var(--color-muted)]">
                      Módulo 3 · 4 lecciones · Entrega: 14 jun.
                    </p>
                  </div>

                  {/* Resources */}
                  <div>
                    <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                      Recursos descargables
                    </p>
                    <div className="space-y-1.5">
                      {mockResources.map((r) => (
                        <div
                          key={r.title}
                          className="flex items-center gap-2 rounded-[var(--radius-xs)] border border-[var(--color-border-subtle)] bg-white px-2.5 py-2"
                        >
                          <FileText className="h-3 w-3 shrink-0 text-[var(--color-primary)]" />
                          <span className="min-w-0 flex-1 truncate text-[0.65rem] text-[var(--color-ink-soft)]">
                            {r.title}
                          </span>
                          <span className="shrink-0 text-[0.6rem] text-[var(--color-muted)]">
                            {r.pages}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Forum preview */}
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                        Foro del módulo
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {mockMessages.map((msg) => (
                        <div
                          key={msg.author}
                          className={`rounded-[var(--radius-xs)] px-3 py-2 text-[0.65rem] leading-5 ${
                            msg.isTeacher
                              ? "bg-[var(--color-brand-soft)]"
                              : "border border-[var(--color-border-subtle)] bg-white"
                          }`}
                        >
                          <div className="mb-0.5 flex items-center justify-between gap-2">
                            <span
                              className={`font-semibold ${msg.isTeacher ? "text-[var(--color-primary)]" : "text-[var(--color-ink)]"}`}
                            >
                              {msg.author}
                            </span>
                            <span className="text-[0.58rem] text-[var(--color-muted)]">
                              {msg.time}
                            </span>
                          </div>
                          <p className="text-[var(--color-ink-soft)]">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
