import Link from "next/link";
import { Eye, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CourseGridItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "ACTIVE" | "INACTIVE";
  accentFrom: string;
  accentTo: string;
  enrollmentCount: number;
  revenueInCents: number;
  editHref: string;
  viewHref: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRevenue(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(0)}`;
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "ACTIVE" | "INACTIVE" }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d1fae5] px-2.5 py-1 text-[0.72rem] font-semibold text-[#065f46]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
        Publicado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(22,60,88,0.08)] px-2.5 py-1 text-[0.72rem] font-semibold text-[var(--color-ink-soft)]">
      <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M9 12h6m-3-3v6M3 12a9 9 0 1018 0A9 9 0 003 12z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Borrador
    </span>
  );
}

// ─── Metric item ───────────────────────────────────────────────────────────────

function Metric({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {label}
      </span>
      <span
        className={cn(
          "mt-0.5 text-[1.1rem] font-bold leading-none text-[var(--color-ink)]",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Course card ───────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: CourseGridItem }) {
  const isDraft = course.status === "INACTIVE";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.09)] bg-white shadow-[0_2px_8px_rgba(22,60,88,0.06)] transition hover:shadow-[0_4px_16px_rgba(22,60,88,0.1)]">
      {/* Image / gradient area */}
      <div className="relative h-[11rem] overflow-hidden">
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(135deg, ${course.accentFrom} 0%, ${course.accentTo} 100%)`,
          }}
        />
        <div className="absolute right-3 top-3">
          <StatusBadge status={course.status} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-5 pt-4 pb-3">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          {course.category || "Sin categoría"}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-[1.08rem] font-bold leading-snug text-[var(--color-ink)]">
          {course.title}
        </h3>

        {/* Metrics */}
        <div className="mt-4 flex items-end gap-5 border-t border-[rgba(22,60,88,0.07)] pt-4">
          <Metric label="Alumnos" value={course.enrollmentCount} />
          <Metric label="Fin." value="--" valueClassName="text-[var(--color-muted)]" />
          <Metric
            label="Ingresos"
            value={isDraft ? "$0" : formatRevenue(course.revenueInCents)}
          />
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-between border-t border-[rgba(22,60,88,0.07)] px-5 py-3">
        {isDraft ? (
          <Link
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            href={course.editHref}
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
            Continuar Edición
          </Link>
        ) : (
          <Link
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            href={course.editHref}
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
            Editar
          </Link>
        )}

        <div className="flex items-center gap-1">
          {isDraft ? (
            <Link
              aria-label="Eliminar borrador"
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition hover:bg-[rgba(220,38,38,0.07)] hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              href={course.editHref}
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          ) : (
            <>
              <Link
                aria-label="Ver curso"
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[rgba(22,60,88,0.06)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                href={course.viewHref}
              >
                <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                Ver
              </Link>
              <Link
                aria-label="Publicar / gestionar"
                className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.06)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                href={course.editHref}
                title="Gestionar publicación"
              >
                <PlusCircle className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyGrid({ tab }: { tab: string }) {
  const messages: Record<string, string> = {
    publicados: "No hay cursos publicados todavía.",
    borradores: "No hay borradores activos.",
    archivados: "No hay cursos archivados.",
    todos: "No se encontraron cursos con los filtros actuales.",
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(22,60,88,0.15)] bg-white py-20 text-center">
      <p className="text-sm font-medium text-[var(--color-ink-soft)]">
        {messages[tab] ?? messages.todos}
      </p>
    </div>
  );
}

// ─── Grid ──────────────────────────────────────────────────────────────────────

export function CourseGrid({
  courses,
  tab,
}: {
  courses: CourseGridItem[];
  tab: string;
}) {
  if (courses.length === 0) {
    return <EmptyGrid tab={tab} />;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard course={course} key={course.id} />
      ))}
    </div>
  );
}
