"use client";

import { useActionState, useState } from "react";
import {
  deleteCourseResourceAction,
  moveCourseResourceAction,
  toggleCourseResourcePublicationAction,
  updateCourseResourceAction,
  type CourseResourceFormState,
} from "@/actions/course-resources";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CampusResourceItem } from "@/lib/course-resources";

const initialState: CourseResourceFormState = {};

function toDateTimeLocalValue(value: Date | string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
}

type CourseManagedResourceControlsProps = {
  courseSlug: string;
  modules: CatalogCourse["modules"];
  resource: CampusResourceItem;
  isFirst: boolean;
  isLast: boolean;
};

export function CourseManagedResourceControls({
  courseSlug,
  modules,
  resource,
  isFirst,
  isLast,
}: CourseManagedResourceControlsProps) {
  const [state, formAction] = useActionState(
    updateCourseResourceAction,
    initialState,
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-[rgba(12,113,195,0.16)] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="teacher">Gestion docente</Badge>
          <Badge tone={resource.isPublished ? "teacher" : "accent"}>
            {resource.isPublished ? "Publicado" : "Oculto al alumnado"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={moveCourseResourceAction}>
            <input name="courseSlug" type="hidden" value={courseSlug} />
            <input name="resourceId" type="hidden" value={resource.id} />
            <input name="direction" type="hidden" value="up" />
            <Button disabled={isFirst} type="submit" variant="ghost">
              Subir
            </Button>
          </form>

          <form action={moveCourseResourceAction}>
            <input name="courseSlug" type="hidden" value={courseSlug} />
            <input name="resourceId" type="hidden" value={resource.id} />
            <input name="direction" type="hidden" value="down" />
            <Button disabled={isLast} type="submit" variant="ghost">
              Bajar
            </Button>
          </form>

          <form action={toggleCourseResourcePublicationAction}>
            <input name="courseSlug" type="hidden" value={courseSlug} />
            <input name="resourceId" type="hidden" value={resource.id} />
            <input
              name="publish"
              type="hidden"
              value={resource.isPublished ? "false" : "true"}
            />
            <Button type="submit" variant="ghost">
              {resource.isPublished ? "Ocultar" : "Publicar"}
            </Button>
          </form>

          <form action={deleteCourseResourceAction}>
            <input name="courseSlug" type="hidden" value={courseSlug} />
            <input name="resourceId" type="hidden" value={resource.id} />
            <Button type="submit" variant="ghost">
              Eliminar
            </Button>
          </form>
        </div>
      </div>

      <details
        className="rounded-2xl bg-[var(--color-surface)] p-4"
        onToggle={(event) =>
          setIsEditorOpen((event.currentTarget as HTMLDetailsElement).open)
        }
      >
        <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--color-primary)]">
          Editar recurso
        </summary>

        {isEditorOpen ? (
          <form action={formAction} className="mt-4 space-y-4">
            <input name="courseSlug" type="hidden" value={courseSlug} />
            <input name="resourceId" type="hidden" value={resource.id} />

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Titulo
                </span>
                <Input defaultValue={resource.title} name="title" required />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Módulo
                </span>
                <select
                  className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-ink)]"
                  defaultValue={resource.moduleId ?? ""}
                  name="moduleId"
                >
                  <option value="">Todo el curso</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                Descripcion
              </span>
              <Textarea
                className="min-h-24"
                defaultValue={resource.description}
                name="description"
                placeholder="Contexto, instrucciones o criterios de entrega."
              />
            </label>

            {resource.source === "LINK" ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  URL externa
                </span>
                <Input
                  defaultValue={resource.linkUrl ?? ""}
                  name="linkUrl"
                  required
                  type="url"
                />
              </label>
            ) : null}

            {resource.source === "FILE" ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Sustituir archivo
                </span>
                <Input name="file" type="file" />
                <span className="text-xs leading-6 text-[var(--color-muted)]">
                  Si no adjuntas un archivo nuevo, se mantiene el actual.
                </span>
              </label>
            ) : null}

            {resource.isExercise ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Fecha limite
                  </span>
                  <Input
                    defaultValue={toDateTimeLocalValue(resource.dueAt)}
                    name="dueAt"
                    type="datetime-local"
                  />
                  <span className="text-xs leading-6 text-[var(--color-muted)]">
                    Dejalo vacio si el ejercicio no tiene cierre automatico.
                  </span>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Nota minima para aprobar
                  </span>
                  <Input
                    defaultValue={resource.passingScoreLabel ?? ""}
                    max="10"
                    min="0"
                    name="passingScore"
                    placeholder="Ej.: 5"
                    step="0.1"
                    type="number"
                  />
                  <span className="text-xs leading-6 text-[var(--color-muted)]">
                    Dejalo vacio si quieres usar solo nota numerica sin corte
                    automatico.
                  </span>
                </label>
              </div>
            ) : null}

            {state.error ? (
              <p className="rounded-2xl border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
                {state.error}
              </p>
            ) : null}

            {state.success ? (
              <p className="rounded-2xl border border-[#b9dfc2] bg-[#eff9f1] px-4 py-3 text-sm text-[#1d6b35]">
                {state.success}
              </p>
            ) : null}

            <div className="flex justify-end">
              <SubmitButton pendingLabel="Guardando..." variant="secondary">
                Guardar cambios
              </SubmitButton>
            </div>
          </form>
        ) : null}
      </details>
    </div>
  );
}
