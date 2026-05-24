import { AlertTriangle } from "lucide-react";
import {
  syncTeacherCourseAssignmentsAction,
  syncTeacherEditionAssignmentsAction
} from "@/actions/admin";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { StateBanner } from "@/components/ui/state-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  getRoleFilterLabel,
  getRoleTone,
  getUserInitials
} from "@/lib/admin-console";
import { formatDate } from "@/lib/utils";
import type { TeacherCourseOption, TeacherSummary } from "./types";

export function TeacherDetailCard({
  selectedTeacher,
  allCourses
}: {
  selectedTeacher: TeacherSummary;
  allCourses: TeacherCourseOption[];
}) {
  return (
    <SurfaceCard className="w-full min-w-0 scroll-mt-28" id="teacher-detail">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-primary-soft)_76%,white)] text-base font-semibold text-[var(--color-primary)]">
            {getUserInitials(selectedTeacher.name)}
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-[1.9rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
              {selectedTeacher.name}
            </h2>
            <p className="mt-1.5 break-all text-sm text-[var(--color-muted)]">
              {selectedTeacher.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone={getRoleTone(selectedTeacher.globalRole)}>
            {getRoleFilterLabel(selectedTeacher.globalRole)}
          </AdminStatusBadge>
          <AdminStatusBadge tone={selectedTeacher.activeStudents >= 75 ? "danger" : "primary"}>
            {selectedTeacher.activeStudents >= 75 ? "Carga alta" : "Carga estable"}
          </AdminStatusBadge>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatBox label="Alta" value={formatDate(selectedTeacher.createdAt)} />
        <StatBox label="Cursos" value={`${selectedTeacher.courseAssignments.length} asignados`} />
        <StatBox label="Ediciones" value={`${selectedTeacher.editionAssignments.length} activas`} />
      </div>

      <StateBanner
        className="mt-6"
        description={
          selectedTeacher.activeStudents >= 75
            ? "La carga actual supera el umbral recomendado. Conviene revisar apoyo docente, ediciones abiertas y reparto de cursos."
            : "La distribucion de alumnado y cursos permanece dentro del rango previsto para esta cuenta docente."
        }
        icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.8} />}
        title={
          selectedTeacher.activeStudents >= 75
            ? "Alerta de carga alta"
            : "Seguimiento operativo estable"
        }
        tone={selectedTeacher.activeStudents >= 75 ? "danger" : "info"}
      />

      <form action={syncTeacherCourseAssignmentsAction} className="mt-6 space-y-5">
        <input name="teacherUserId" type="hidden" value={selectedTeacher.id} />

        <div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
                Asignacion de cursos
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Marca los cursos que deben quedar bajo supervision de este docente.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {allCourses.map((course) => {
              const checked = selectedTeacher.courseAssignments.some(
                (assignment) => assignment.courseId === course.id
              );

              return (
                <label
                  className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[color:color-mix(in_srgb,var(--color-surface-elevated)_94%,white)] px-4 py-3.5 text-sm text-[var(--color-ink-soft)]"
                  key={course.id}
                >
                  <input defaultChecked={checked} name="courseIds" type="checkbox" value={course.id} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[var(--color-ink)]">{course.title}</span>
                    <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      /cursos/{course.slug}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
            Asignacion de ediciones
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Usa esta capa cuando quieras limitar la docencia a convocatorias concretas sin dar
            acceso a todas las ediciones del curso.
          </p>
        </div>

        <SubmitButton className="w-full" pendingLabel="Guardando asignaciones...">
          Guardar asignaciones
        </SubmitButton>
      </form>

      <form action={syncTeacherEditionAssignmentsAction} className="mt-6 space-y-5">
        <input name="teacherUserId" type="hidden" value={selectedTeacher.id} />

        <div className="space-y-3">
          {allCourses.some((course) => course.editions.length > 0) ? (
            allCourses.map((course) => (
              <div
                className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[color:color-mix(in_srgb,var(--color-surface-elevated)_94%,white)] px-4 py-4"
                key={course.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-ink)]">{course.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      /cursos/{course.slug}
                    </p>
                  </div>
                  <AdminStatusBadge tone="neutral">
                    {course.editions.length} ediciones visibles
                  </AdminStatusBadge>
                </div>

                <div className="mt-4 space-y-2.5">
                  {course.editions.length > 0 ? (
                    course.editions.map((edition) => {
                      const checked = selectedTeacher.editionAssignments.some(
                        (assignment) => assignment.courseEditionId === edition.id
                      );

                      return (
                        <label
                          className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-white px-4 py-3 text-sm text-[var(--color-ink-soft)]"
                          key={edition.id}
                        >
                          <input
                            defaultChecked={checked}
                            name="editionIds"
                            type="checkbox"
                            value={edition.id}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-[var(--color-ink)]">
                              {edition.label}
                            </span>
                            <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                              {edition.status === "ACTIVE" ? "activa" : "programada"}
                            </span>
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[var(--color-muted)]">
                      Este curso no tiene ediciones activas o programadas.
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--color-muted)]">
              No hay ediciones activas o programadas para asignar.
            </p>
          )}
        </div>

        <SubmitButton className="w-full" pendingLabel="Guardando ediciones..." variant="secondary">
          Guardar ediciones asignadas
        </SubmitButton>
      </form>
    </SurfaceCard>
  );
}

function StatBox({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)] p-4">
      <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">{label}</p>
      <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
