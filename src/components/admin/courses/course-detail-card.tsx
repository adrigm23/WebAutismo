import {
  assignTeacherToCourseAction,
  cloneCourseAction,
  unassignTeacherFromCourseAction,
  updateCourseAction
} from "@/actions/admin";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getCourseStatusLabel,
  getCourseStatusTone
} from "@/lib/admin-console";
import type { EditableCourseDetail } from "./types";

export function CourseDetailCard({
  course
}: {
  course: EditableCourseDetail;
}) {
  return (
    <Card className="scroll-mt-28 rounded-[2rem] p-7" id="course-detail">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
            {course.title}
          </h2>
          <p className="mt-2 text-sm text-[#5f7083]">Slug: {course.slug}</p>
        </div>
        <AdminStatusBadge tone={getCourseStatusTone(course.status)}>
          {getCourseStatusLabel(course.status)}
        </AdminStatusBadge>
      </div>

      <form action={updateCourseAction} className="mt-6 grid gap-4">
        <input name="courseId" type="hidden" value={course.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <Input defaultValue={course.title} name="title" />
          <Input defaultValue={course.shortDescription} name="shortDescription" />
        </div>
        <div className="grid gap-4 md:grid-cols-[180px_220px_auto]">
          <Input defaultValue={String(course.priceInCents)} name="priceInCents" type="number" />
          <select
            className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={course.status}
            name="status"
          >
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
          <SubmitButton pendingLabel="Guardando..." variant="secondary">
            Guardar cambios
          </SubmitButton>
        </div>
      </form>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
            Docentes asignados
          </p>
          <div className="mt-4 space-y-3">
            {course.teacherAssignments.length > 0 ? (
              course.teacherAssignments.map((assignment) => (
                <form
                  action={unassignTeacherFromCourseAction}
                  className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-[#d9e1e8] bg-[#fbfcfd] px-4 py-3"
                  key={assignment.id}
                >
                  <input name="courseId" type="hidden" value={course.id} />
                  <input name="teacherUserId" type="hidden" value={assignment.userId} />
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">{assignment.name}</p>
                    <p className="text-sm text-[#5a6c7f]">{assignment.email}</p>
                  </div>
                  <SubmitButton pendingLabel="Quitando..." variant="ghost">
                    Quitar
                  </SubmitButton>
                </form>
              ))
            ) : (
              <p className="text-sm text-[#607285]">Sin docentes asignados.</p>
            )}
          </div>

          <form action={assignTeacherToCourseAction} className="mt-4 flex flex-wrap gap-3">
            <input name="courseId" type="hidden" value={course.id} />
            <select
              className="h-12 min-w-[14rem] flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
              name="teacherUserId"
            >
              {course.teacherCandidates.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} - {teacher.email}
                </option>
              ))}
            </select>
            <SubmitButton pendingLabel="Asignando...">Asignar docente</SubmitButton>
          </form>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
            Clonado rapido
          </p>
          <form action={cloneCourseAction} className="mt-4 space-y-4">
            <input name="sourceSlug" type="hidden" value={course.slug} />
            <Input name="title" placeholder="Nuevo titulo del clon" required />
            <Input name="slug" placeholder="nuevo-slug" required />
            <SubmitButton pendingLabel="Clonando..." variant="secondary">
              Clonar este curso
            </SubmitButton>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#314255]">
          Ediciones del curso
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {course.editions.map((edition) => (
            <AdminStatusBadge key={edition.id} tone={edition.status === "ACTIVE" ? "primary" : "neutral"}>
              {edition.label}
            </AdminStatusBadge>
          ))}
        </div>
      </div>
    </Card>
  );
}
