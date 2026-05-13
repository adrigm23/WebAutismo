import { AlertTriangle } from "lucide-react";
import {
  syncTeacherCourseAssignmentsAction,
  syncTeacherEditionAssignmentsAction
} from "@/actions/admin";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getRoleFilterLabel,
  getRoleTone,
  getUserInitials
} from "@/lib/admin-console";
import { cn, formatDate } from "@/lib/utils";
import type { TeacherCourseOption, TeacherSummary } from "./types";

export function TeacherDetailCard({
  selectedTeacher,
  allCourses
}: {
  selectedTeacher: TeacherSummary;
  allCourses: TeacherCourseOption[];
}) {
  return (
    <Card className="overflow-hidden rounded-[2rem]">
      <div className="border-b border-[#dde4ec] px-7 py-7">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
            {getUserInitials(selectedTeacher.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[2rem] font-semibold leading-none tracking-[-0.06em] text-[var(--color-ink)]">
              {selectedTeacher.name}
            </h2>
            <p className="mt-2 truncate text-sm text-[#5b6d80]">{selectedTeacher.email}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <AdminStatusBadge tone={getRoleTone(selectedTeacher.globalRole)}>
                {getRoleFilterLabel(selectedTeacher.globalRole)}
              </AdminStatusBadge>
              <AdminStatusBadge tone={selectedTeacher.activeStudents >= 75 ? "danger" : "primary"}>
                {selectedTeacher.activeStudents >= 75 ? "Carga alta" : "Carga estable"}
              </AdminStatusBadge>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatBox label="Alta" value={formatDate(selectedTeacher.createdAt)} />
          <StatBox label="Cursos" value={`${selectedTeacher.courseAssignments.length} asignados`} />
          <StatBox
            label="Ediciones"
            value={`${selectedTeacher.editionAssignments.length} activas`}
          />
        </div>
      </div>

      <div className="px-7 py-7">
        <div
          className={cn(
            "rounded-[1.5rem] border px-5 py-4 text-sm leading-7",
            selectedTeacher.activeStudents >= 75
              ? "border-[#f3b3ac] bg-[#fff2f0] text-[#a03329]"
              : "border-[#dbe6ef] bg-[#f7fafc] text-[#44586d]"
          )}
        >
          <div className="flex items-center gap-3 font-semibold">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.8} />
            {selectedTeacher.activeStudents >= 75
              ? "Alerta de carga alta"
              : "Seguimiento operativo estable"}
          </div>
          <p className="mt-2">
            {selectedTeacher.activeStudents >= 75
              ? "La carga actual supera el umbral recomendado. Conviene revisar apoyo docente, ediciones abiertas y reparto de cursos."
              : "La distribucion de alumnado y cursos permanece dentro del rango previsto para esta cuenta docente."}
          </p>
        </div>

        <form action={syncTeacherCourseAssignmentsAction} className="mt-6 space-y-5">
          <input name="teacherUserId" type="hidden" value={selectedTeacher.id} />

          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
                  Asignacion de cursos
                </p>
                <p className="mt-2 text-sm leading-6 text-[#5c6f83]">
                  Marca los cursos que deben quedar bajo supervision de este docente.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {allCourses.map((course) => {
                const checked = selectedTeacher.courseAssignments.some(
                  (assignment) => assignment.courseId === course.id
                );

                return (
                  <label
                    className="flex items-start gap-3 rounded-[1.2rem] border border-[#d9e1e8] bg-[#fbfcfd] px-4 py-4 text-sm text-[#33475b]"
                    key={course.id}
                  >
                    <input defaultChecked={checked} name="courseIds" type="checkbox" value={course.id} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-[var(--color-ink)]">{course.title}</span>
                      <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-[#6a7b8d]">
                        /cursos/{course.slug}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
              Asignacion de ediciones
            </p>
            <p className="mt-2 text-sm leading-6 text-[#5c6f83]">
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
                  className="rounded-[1.3rem] border border-[#d9e1e8] bg-[#fbfcfd] px-4 py-4"
                  key={course.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">{course.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#6a7b8d]">
                        /cursos/{course.slug}
                      </p>
                    </div>
                    <AdminStatusBadge tone="neutral">
                      {course.editions.length} ediciones visibles
                    </AdminStatusBadge>
                  </div>

                  <div className="mt-4 space-y-3">
                    {course.editions.length > 0 ? (
                      course.editions.map((edition) => {
                        const checked = selectedTeacher.editionAssignments.some(
                          (assignment) => assignment.courseEditionId === edition.id
                        );

                        return (
                          <label
                            className="flex items-start gap-3 rounded-[1rem] border border-[#e1e8ef] bg-white px-4 py-3 text-sm text-[#33475b]"
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
                              <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-[#6a7b8d]">
                                {edition.status === "ACTIVE" ? "activa" : "programada"}
                              </span>
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="text-sm text-[#647589]">Este curso no tiene ediciones activas o programadas.</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#647589]">No hay ediciones activas o programadas para asignar.</p>
            )}
          </div>

          <SubmitButton className="w-full" pendingLabel="Guardando ediciones..." variant="secondary">
            Guardar ediciones asignadas
          </SubmitButton>
        </form>
      </div>
    </Card>
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
    <div className="rounded-[1.4rem] bg-[#f6fafc] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a6c80]">{label}</p>
      <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
