import { CheckCircle2 } from "lucide-react";

const modules = [
  { label: "Módulo 1", state: "Completado" },
  { label: "Módulo 2", state: "En curso" },
  { label: "Foro del curso", state: "Activo" }
];

export function HomeProductShowcase() {
  return (
    <div aria-label="Vista previa del campus y del flujo de formación" className="relative">
      <div className="overflow-hidden rounded-[1.35rem] border border-[rgba(12,113,195,0.14)] bg-[var(--color-surface-strong)] shadow-[var(--shadow-strong)]">
        <div className="flex items-center gap-2 border-b border-[rgba(12,113,195,0.1)] bg-[var(--color-surface)] px-4 py-3">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#e2c4c4]" />
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#e8d9a8]" />
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#b8d4c4]" />
          <span className="ml-2 truncate text-xs text-[var(--color-muted)]">
            campus.autismocordoba.org / mis-cursos
          </span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[11rem_1fr]">
          <div
            aria-hidden
            className="hidden border-r border-[rgba(12,113,195,0.1)] bg-[var(--color-surface)] p-4 lg:block"
          >
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Área privada
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink)]">
              <li className="rounded-lg bg-white px-3 py-2 font-medium text-[var(--color-primary)]">
                Mis cursos
              </li>
              <li className="rounded-lg px-3 py-2 text-[var(--color-muted)]">Mi cuenta</li>
              <li className="rounded-lg px-3 py-2 text-[var(--color-muted)]">Foro</li>
            </ul>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--color-muted)]">Curso activo</p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                  Intervención en autismo
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                Edición vigente
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {modules.map((module) => (
                <div
                  className="rounded-xl border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-3"
                  key={module.label}
                >
                  <p className="text-xs font-medium text-[var(--color-muted)]">{module.label}</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{module.state}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-[rgba(12,113,195,0.12)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                Inscripción
              </p>
              <ul className="mt-3 space-y-2.5">
                {[
                  "Pago seguro cuando Stripe está activo",
                  "Activación visible en tu cuenta",
                  "Foro y materiales bajo permisos"
                ].map((item) => (
                  <li className="flex items-start gap-2.5 text-sm text-[var(--color-ink)]" key={item}>
                    <CheckCircle2
                      aria-hidden
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(12,113,195,0.08),transparent_62%)]"
      />
    </div>
  );
}
