export function HomeProductShowcase() {
  return (
    <div aria-label="Vista previa del campus y del flujo de formacion" className="relative">
      <div className="overflow-hidden rounded-[1.5rem] border border-[rgba(12,113,195,0.14)] bg-[var(--color-surface-strong)] shadow-[0_22px_56px_rgba(21,35,50,0.08)]">
        <div className="flex items-center gap-2 border-b border-[rgba(12,113,195,0.1)] bg-[var(--color-surface)] px-4 py-3">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#e2c4c4]" />
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#e8d9a8]" />
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#b8d4c4]" />
          <span className="ml-2 truncate text-xs text-[var(--color-muted)]">
            campus.autismocordoba.org / mis-cursos
          </span>
        </div>

        <div className="space-y-0 px-6 py-6">
          <div className="border-b border-[rgba(12,113,195,0.1)] pb-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Curso activo
            </p>
            <p className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)]">
              Intervencion en autismo
            </p>
            <p className="mt-3 max-w-md text-sm leading-7 text-[var(--color-muted)]">
              Un acceso claro al campus, materiales del curso y seguimiento dentro de la misma
              cuenta.
            </p>
          </div>

          <div className="grid gap-0 border-b border-[rgba(12,113,195,0.1)] py-5">
            <div className="flex items-center justify-between gap-4 py-3">
              <p className="text-sm font-medium text-[var(--color-ink)]">Contenido del curso</p>
              <span className="text-sm text-[var(--color-muted)]">Disponible</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <p className="text-sm font-medium text-[var(--color-ink)]">Tareas y materiales</p>
              <span className="text-sm text-[var(--color-muted)]">Acceso privado</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <p className="text-sm font-medium text-[var(--color-ink)]">Foro del curso</p>
              <span className="text-sm text-[var(--color-muted)]">Protegido</span>
            </div>
          </div>

          <div className="pt-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Flujo de acceso
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              La compra activa el curso en tu cuenta y mantiene el acceso segun matricula y
              ventana de edicion.
            </p>
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
