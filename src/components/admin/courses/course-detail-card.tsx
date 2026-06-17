import Link from "next/link";
import {
  assignTeacherToCourseAction,
  cloneCourseAction,
  unassignTeacherFromCourseAction,
  updateCourseAction,
  updateCourseContentAction,
} from "@/actions/admin";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { StateBanner } from "@/components/ui/state-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { SurfaceCard } from "@/components/ui/surface-card";
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
    <SurfaceCard className="scroll-mt-28" id="course-detail">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
            {course.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Slug: {course.slug}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusBadge tone={getCourseStatusTone(course.status)}>
            {getCourseStatusLabel(course.status)}
          </AdminStatusBadge>
          <Link
            href={`/docente/cursos/${course.slug}/constructor`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            Abrir constructor
          </Link>
        </div>
      </div>

      {course.status === "INACTIVE" && (
        <form action={updateCourseAction} className="mt-6">
          <input name="courseId" type="hidden" value={course.id} />
          <input name="title" type="hidden" value={course.title} />
          <input name="shortDescription" type="hidden" value={course.shortDescription} />
          <input name="priceInCents" type="hidden" value={String(course.priceInCents)} />
          <input name="status" type="hidden" value="ACTIVE" />
          <SubmitButton className="w-full" pendingLabel="Publicando...">
            Publicar curso
          </SubmitButton>
        </form>
      )}

      <form action={updateCourseAction} className="mt-4 grid gap-4">
        <input name="courseId" type="hidden" value={course.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <Input defaultValue={course.title} name="title" />
          <Input defaultValue={course.shortDescription} name="shortDescription" />
        </div>
        <div className="grid gap-4 md:grid-cols-[180px_minmax(0,220px)_auto]">
          <Input defaultValue={String(course.priceInCents)} name="priceInCents" type="number" />
          <Select defaultValue={course.status} name="status">
            <SelectTrigger aria-label="Estado del curso">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Activo</SelectItem>
              <SelectItem value="INACTIVE">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          <SubmitButton pendingLabel="Guardando..." variant="secondary">
            Guardar cambios
          </SubmitButton>
        </div>
      </form>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div>
          <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
            Docentes asignados
          </p>
          <div className="mt-4 space-y-3">
            {course.teacherAssignments.length > 0 ? (
              course.teacherAssignments.map((assignment) => (
                <form
                  action={unassignTeacherFromCourseAction}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[color:color-mix(in_srgb,var(--color-surface-elevated)_94%,white)] px-4 py-3"
                  key={assignment.id}
                >
                  <input name="courseId" type="hidden" value={course.id} />
                  <input name="teacherUserId" type="hidden" value={assignment.userId} />
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">{assignment.name}</p>
                    <p className="text-sm text-[var(--color-muted)]">{assignment.email}</p>
                  </div>
                  <SubmitButton pendingLabel="Quitando..." variant="ghost">
                    Quitar
                  </SubmitButton>
                </form>
              ))
            ) : (
              <StateBanner
                description="Asigna al menos un docente para que el curso quede operativo en nuevas ediciones."
                tone="info"
              />
            )}
          </div>

          {course.teacherCandidates.length ? (
            <form action={assignTeacherToCourseAction} className="mt-4 flex flex-wrap gap-3">
              <input name="courseId" type="hidden" value={course.id} />
              <div className="min-w-[14rem] flex-1">
                <Select
                  defaultValue={course.teacherCandidates[0]?.id}
                  name="teacherUserId"
                >
                  <SelectTrigger aria-label="Seleccionar docente">
                    <SelectValue placeholder="Seleccionar docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {course.teacherCandidates.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} - {teacher.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <SubmitButton pendingLabel="Asignando...">Asignar docente</SubmitButton>
            </form>
          ) : (
            <StateBanner
              className="mt-4"
              description="No hay mas docentes elegibles para asignar en este curso."
              tone="info"
            />
          )}
        </div>

        <div>
          <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
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

      {/* ── Contenido de la página del curso ─────────────────────────── */}
      <div className="mt-8" id="course-content">
        <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
          Contenido del curso (página pública)
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Un ítem por línea. FAQ: escribe{" "}
          <code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-[0.7rem]">
            Pregunta | Respuesta
          </code>{" "}
          por línea.
        </p>
        <form action={updateCourseContentAction} className="mt-4 grid gap-4">
          <input name="courseId" type="hidden" value={course.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--color-ink-soft)]">
                ¿A quién va dirigido?
              </span>
              <textarea
                className="ui-control-base min-h-[100px] w-full resize-y px-3 py-2 text-sm"
                defaultValue={course.audienceJson.join("\n")}
                name="audienceJson"
                placeholder="Profesionales del ámbito educativo&#10;Familias con hijos con TEA"
                rows={4}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--color-ink-soft)]">
                Qué aprenderás (objetivos)
              </span>
              <textarea
                className="ui-control-base min-h-[100px] w-full resize-y px-3 py-2 text-sm"
                defaultValue={course.outcomesJson.join("\n")}
                name="outcomesJson"
                placeholder="Identificar señales tempranas de TEA&#10;Aplicar estrategias de comunicación aumentativa"
                rows={4}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--color-ink-soft)]">
                Metodología
              </span>
              <textarea
                className="ui-control-base min-h-[100px] w-full resize-y px-3 py-2 text-sm"
                defaultValue={course.methodologyJson.join("\n")}
                name="methodologyJson"
                placeholder="Vídeos explicativos con casos reales&#10;Tareas prácticas evaluadas por docentes"
                rows={4}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--color-ink-soft)]">
                Preguntas frecuentes (Pregunta | Respuesta)
              </span>
              <textarea
                className="ui-control-base min-h-[100px] w-full resize-y px-3 py-2 text-sm"
                defaultValue={course.faqJson
                  .map((f) => `${f.question} | ${f.answer}`)
                  .join("\n")}
                name="faqJson"
                placeholder="¿Hay certificado? | Sí, al completar el curso&#10;¿Cuánto dura el acceso? | 12 meses"
                rows={4}
              />
            </label>
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Guardando..." variant="secondary">
              Guardar contenido
            </SubmitButton>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
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
    </SurfaceCard>
  );
}
