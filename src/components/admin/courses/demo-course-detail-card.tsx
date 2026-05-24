import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  getCourseStatusLabel,
  getCourseStatusTone
} from "@/lib/admin-console";
import type { DemoCourseDetail } from "./types";

export function DemoCourseDetailCard({
  course
}: {
  course: DemoCourseDetail;
}) {
  return (
    <SurfaceCard className="scroll-mt-28" id="course-detail">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
            {course.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Slug: {course.slug}</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {course.shortDescription}
          </p>
        </div>
        <AdminStatusBadge tone={getCourseStatusTone(course.status)}>
          {getCourseStatusLabel(course.status)}
        </AdminStatusBadge>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div>
          <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
            Docentes asignados
          </p>
          <div className="mt-4 space-y-3">
            {course.teachers.length > 0 ? (
              course.teachers.map((teacher) => (
                <div
                  className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[color:color-mix(in_srgb,var(--color-surface-elevated)_94%,white)] px-4 py-3"
                  key={teacher}
                >
                  <p className="font-medium text-[var(--color-ink)]">{teacher}</p>
                </div>
              ))
            ) : (
              <StateBanner
                description="Este curso demo todavia no tiene docentes simulados asignados."
                tone="info"
              />
            )}
          </div>
        </div>
        <div>
          <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
            Resumen operativo
          </p>
          <StateBanner
            className="mt-4"
            description="Esta seccion esta en modo demo. Puedes revisar la composicion y la jerarquia visual, pero los cambios no se guardan hasta conectar la base de datos."
            tone="info"
          />
        </div>
      </div>
    </SurfaceCard>
  );
}
