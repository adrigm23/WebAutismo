import { ListFilter } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { SurfaceCard } from "@/components/ui/surface-card";
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
  teachers,
  exportLinks
}: {
  q: string;
  courseId: string;
  teacherId: string;
  accessState: "ALL" | SupervisionAccessState;
  courses: SupervisionCourseOption[];
  teachers: SupervisionTeacherOption[];
  exportLinks?: Array<{
    href: string;
    label: string;
  }>;
}) {
  return (
    <SurfaceCard padding="md">
      <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[auto_1fr_1fr_1fr]">
        <input name="q" type="hidden" value={q} />

        <Button
          aria-label="Aplicar filtros"
          className="justify-self-start"
          size="icon"
          type="submit"
          variant="secondary"
        >
          <ListFilter className="size-4" strokeWidth={2} />
        </Button>

        <Select defaultValue={courseId} name="courseId">
          <SelectTrigger aria-label="Curso">
            <SelectValue placeholder="Todos los cursos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los cursos</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select defaultValue={teacherId} name="teacherId">
          <SelectTrigger aria-label="Profesorado">
            <SelectValue placeholder="Todo el profesorado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todo el profesorado</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select defaultValue={accessState} name="accessState">
          <SelectTrigger aria-label="Estado del acceso">
            <SelectValue placeholder="Todos los accesos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los accesos</SelectItem>
            <SelectItem value="active">Vigentes</SelectItem>
            <SelectItem value="scheduled">Programados</SelectItem>
            <SelectItem value="expired">Caducados</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </form>

      {exportLinks?.length ? (
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-3 border-t border-[var(--color-border-subtle)] pt-5">
          {exportLinks.map((link) => (
            <ButtonLink
              className="min-h-0 px-0 py-0 text-[0.98rem] font-semibold text-[var(--color-ink)] shadow-none hover:translate-y-0"
              href={link.href}
              key={link.href}
              size="sm"
              variant="ghost"
            >
              {link.label}
            </ButtonLink>
          ))}
        </div>
      ) : null}
    </SurfaceCard>
  );
}
