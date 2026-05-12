import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import type {
  SupervisionAccessState,
  SupervisionCourseOption,
  SupervisionTeacherOption
} from "./types";

export function SupervisionFiltersCard({
  q,
  courseId,
  teacherId,
  accessState,
  courses,
  teachers
}: {
  q: string;
  courseId: string;
  teacherId: string;
  accessState: "ALL" | SupervisionAccessState;
  courses: SupervisionCourseOption[];
  teachers: SupervisionTeacherOption[];
}) {
  return (
    <Card className="rounded-[2rem] p-7">
      <form className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
        <Input defaultValue={q} name="q" placeholder="Buscar estudiantes o cursos..." />
        <select
          className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
          defaultValue={courseId}
          name="courseId"
        >
          <option value="ALL">Todos los cursos</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <select
          className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
          defaultValue={teacherId}
          name="teacherId"
        >
          <option value="ALL">Todo el profesorado</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </select>
        <select
          className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
          defaultValue={accessState}
          name="accessState"
        >
          <option value="ALL">Todos los accesos</option>
          <option value="active">Vigentes</option>
          <option value="scheduled">Programados</option>
          <option value="expired">Caducados</option>
          <option value="inactive">Inactivos</option>
        </select>
        <SubmitButton pendingLabel="Filtrando..." variant="secondary">
          Aplicar filtros
        </SubmitButton>
      </form>
    </Card>
  );
}
