import {
  BookOpen,
  CheckCircle2,
  FileText,
  Play,
  TrendingUp,
} from "lucide-react";

const modules = [
  { title: "Diagnóstico y evaluación", done: true, active: false },
  { title: "Intervención temprana", done: false, active: true },
  { title: "Herramientas de intervención", done: false, active: false },
  { title: "Entorno inclusivo", done: false, active: false },
];

const resources = [
  { title: "Protocolo de evaluación funcional", type: "PDF" },
  { title: "Fichas de apoyo visual PECS", type: "PDF" },
];

export function HomeProductShowcase() {
  return (
    <div aria-hidden="true" className="relative select-none">
      <div className="ui-card-base overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_srgb,var(--color-danger-soft)_70%,var(--color-danger)_30%)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_srgb,var(--color-warning-soft)_70%,var(--color-accent-warm)_30%)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_srgb,var(--color-success-soft)_70%,var(--color-success)_30%)]" />
          </div>
          <span className="min-w-0 flex-1 truncate rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-3 py-1 text-[0.68rem] text-[var(--color-muted)]">
            Campus Autismo Córdoba · Vista previa del aprendizaje
          </span>
        </div>

        {/* Campus layout — sidebar hidden on mobile, shown on sm+ */}
        <div className="grid sm:grid-cols-[9rem_1fr]">
          {/* Sidebar — hidden on small mobile */}
          <div className="hidden border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] p-2.5 sm:block">
            <p className="mb-2 px-2 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Módulos
            </p>
            <div className="space-y-0.5">
              {modules.map((m) => (
                <div
                  key={m.title}
                  className={`flex items-center gap-1.5 rounded-[var(--radius-xs)] px-2 py-1.5 text-[0.68rem] ${
                    m.active
                      ? "bg-[var(--color-brand-soft)] font-semibold text-[var(--color-primary)]"
                      : "text-[var(--color-ink-soft)]"
                  }`}
                >
                  {m.done ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-[var(--color-success)]" />
                  ) : (
                    <span
                      className={`h-3 w-3 shrink-0 rounded-full border ${
                        m.active
                          ? "border-[var(--color-primary)]"
                          : "border-[var(--color-border)]"
                      }`}
                    />
                  )}
                  <span className="truncate leading-tight">{m.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="space-y-3.5 p-4">
            {/* Progress */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[0.68rem] font-semibold text-[var(--color-ink)]">
                  Tu progreso
                </span>
                <span className="text-[0.68rem] font-semibold text-[var(--color-primary)]">
                  68 %
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div className="h-full w-[68%] rounded-full bg-[var(--color-primary)]" />
              </div>
              <p className="mt-1 text-[0.6rem] text-[var(--color-muted)]">
                Intervención temprana — 68%
              </p>
            </div>

            {/* Next lesson */}
            <div className="rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <BookOpen className="h-3 w-3 text-[var(--color-primary)]" />
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)]">
                  Próxima lección
                </span>
              </div>
              <p className="text-[0.73rem] font-semibold leading-tight text-[var(--color-ink)]">
                Módulo 3 · Herramientas de intervención
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Play className="h-2.5 w-2.5 text-[var(--color-muted)]" />
                <p className="text-[0.62rem] text-[var(--color-muted)]">
                  15 min · Vídeo
                </p>
              </div>
            </div>

            {/* Resources */}
            <div>
              <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Recursos
              </p>
              <div className="space-y-1.5">
                {resources.map((r) => (
                  <div
                    key={r.title}
                    className="flex items-center gap-2 rounded-[var(--radius-xs)] border border-[var(--color-border-subtle)] bg-white px-2.5 py-1.5"
                  >
                    <FileText className="h-3 w-3 shrink-0 text-[var(--color-primary)]" />
                    <span className="min-w-0 flex-1 truncate text-[0.65rem] text-[var(--color-ink-soft)]">
                      {r.title}
                    </span>
                    <span className="shrink-0 rounded-sm bg-[var(--color-danger-soft)] px-1 py-0.5 text-[0.55rem] font-semibold uppercase text-[var(--color-danger)]">
                      {r.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-4 -left-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white px-3 py-2.5 shadow-[var(--shadow-medium)] sm:-left-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
          <div>
            <p className="text-[0.7rem] font-semibold text-[var(--color-ink)]">
              Seguimiento activo
            </p>
            <p className="text-[0.62rem] text-[var(--color-muted)]">
              Progreso en tiempo real
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
