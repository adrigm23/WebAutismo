"use client";

import { useActionState, useState } from "react";
import {
  createRubricCriterionAction,
  deleteRubricCriterionAction,
  deleteCourseResourceAction,
  moveCourseResourceAction,
  toggleCourseResourcePublicationAction,
  updateCourseResourceAction,
  type CourseResourceFormState,
  type RubricCriterionFormState,
} from "@/actions/course-resources";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StateBanner } from "@/components/ui/state-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CampusResourceItem } from "@/lib/course-resources";

const initialState: CourseResourceFormState = {};
const initialRubricState: RubricCriterionFormState = {};
const selectClassName =
  "ui-control-base h-[var(--control-height-md)] px-4 text-sm";

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
  const [rubricState, rubricFormAction] = useActionState(
    createRubricCriterionAction,
    initialRubricState,
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isRubricOpen, setIsRubricOpen] = useState(false);

  return (
    <div className="mt-5 space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="teacher">Gestion docente</Badge>
          <Badge tone={resource.isPublished ? "teacher" : "accent"}>
            {resource.isPublished ? "Publicado" : "Oculto al alumnado"}
          </Badge>
        </div>

        <div className="sm:hidden">
          <details className="group">
            <summary className="inline-flex min-h-9 cursor-pointer list-none items-center rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-white/84 px-3 text-sm font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-border-strong)] hover:bg-white">
              Mas acciones
            </summary>

            <div className="mt-2 grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white/94 p-2 shadow-[var(--shadow-soft)]">
              <form action={moveCourseResourceAction}>
                <input name="courseSlug" type="hidden" value={courseSlug} />
                <input name="resourceId" type="hidden" value={resource.id} />
                <input name="direction" type="hidden" value="up" />
                <Button
                  className="min-h-9 w-full justify-start px-3 text-sm"
                  disabled={isFirst}
                  size="sm"
                  type="submit"
                  variant="subtle"
                >
                  Subir
                </Button>
              </form>

              <form action={moveCourseResourceAction}>
                <input name="courseSlug" type="hidden" value={courseSlug} />
                <input name="resourceId" type="hidden" value={resource.id} />
                <input name="direction" type="hidden" value="down" />
                <Button
                  className="min-h-9 w-full justify-start px-3 text-sm"
                  disabled={isLast}
                  size="sm"
                  type="submit"
                  variant="subtle"
                >
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
                <Button
                  className="min-h-9 w-full justify-start px-3 text-sm"
                  size="sm"
                  type="submit"
                  variant="subtle"
                >
                  {resource.isPublished ? "Ocultar" : "Publicar"}
                </Button>
              </form>

              <form action={deleteCourseResourceAction}>
                <input name="courseSlug" type="hidden" value={courseSlug} />
                <input name="resourceId" type="hidden" value={resource.id} />
                <Button
                  className="min-h-9 w-full justify-start px-3 text-sm"
                  size="sm"
                  type="submit"
                  variant="subtle"
                >
                  Eliminar
                </Button>
              </form>
            </div>
          </details>
        </div>

        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          <form action={moveCourseResourceAction}>
            <input name="courseSlug" type="hidden" value={courseSlug} />
            <input name="resourceId" type="hidden" value={resource.id} />
            <input name="direction" type="hidden" value="up" />
            <Button
              className="min-h-9 px-3 text-[0.82rem]"
              disabled={isFirst}
              size="sm"
              type="submit"
              variant="subtle"
            >
              Subir
            </Button>
          </form>

          <form action={moveCourseResourceAction}>
            <input name="courseSlug" type="hidden" value={courseSlug} />
            <input name="resourceId" type="hidden" value={resource.id} />
            <input name="direction" type="hidden" value="down" />
            <Button
              className="min-h-9 px-3 text-[0.82rem]"
              disabled={isLast}
              size="sm"
              type="submit"
              variant="subtle"
            >
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
            <Button
              className="min-h-9 px-3 text-[0.82rem]"
              size="sm"
              type="submit"
              variant="subtle"
            >
              {resource.isPublished ? "Ocultar" : "Publicar"}
            </Button>
          </form>

          <form action={deleteCourseResourceAction}>
            <input name="courseSlug" type="hidden" value={courseSlug} />
            <input name="resourceId" type="hidden" value={resource.id} />
            <Button
              className="min-h-9 px-3 text-[0.82rem]"
              size="sm"
              type="submit"
              variant="subtle"
            >
              Eliminar
            </Button>
          </form>
        </div>
      </div>

      <details
        className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4"
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
                  Modulo
                </span>
                <select
                  className={selectClassName}
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

            {state.error ? <StateBanner description={state.error} tone="danger" /> : null}

            {state.success ? <StateBanner description={state.success} tone="success" /> : null}

            <div className="flex justify-end">
              <SubmitButton pendingLabel="Guardando..." variant="secondary">
                Guardar cambios
              </SubmitButton>
            </div>
          </form>
        ) : null}
      </details>

      {/* ── Rubric criteria (only for exercises) ───────────────────────── */}
      {resource.isExercise && (
        <details
          open={isRubricOpen}
          onToggle={(e) => setIsRubricOpen((e.target as HTMLDetailsElement).open)}
          className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-[var(--color-ink-soft)]">
            <span>Criterios de rúbrica ({resource.rubricCriteria.length})</span>
            <span className="text-xs text-[var(--color-muted)]">{isRubricOpen ? "▲" : "▼"}</span>
          </summary>

          <div className="space-y-3 px-4 pb-4">
            {resource.rubricCriteria.length > 0 && (
              <ul className="divide-y divide-[var(--color-border-subtle)]">
                {resource.rubricCriteria.map((criterion) => (
                  <li key={criterion.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)]">{criterion.title}</p>
                      {criterion.description && (
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">{criterion.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                        {criterion.maxPoints} pts
                      </span>
                      <form action={deleteRubricCriterionAction}>
                        <input type="hidden" name="courseSlug" value={courseSlug} />
                        <input type="hidden" name="resourceId" value={resource.id} />
                        <input type="hidden" name="criterionId" value={criterion.id} />
                        <button
                          type="submit"
                          className="text-xs text-[var(--color-danger)] hover:underline"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form action={rubricFormAction} className="space-y-3 rounded-lg border border-[var(--color-border)] p-3">
              <p className="text-xs font-semibold text-[var(--color-ink-soft)]">Añadir criterio</p>
              <input type="hidden" name="courseSlug" value={courseSlug} />
              <input type="hidden" name="resourceId" value={resource.id} />
              <div className="grid gap-2 sm:grid-cols-[1fr_80px]">
                <Input name="title" placeholder="Ej. Claridad en la exposición" required />
                <Input
                  max="100"
                  min="1"
                  name="maxPoints"
                  placeholder="Pts"
                  required
                  step="0.5"
                  type="number"
                />
              </div>
              <Input name="description" placeholder="Descripción opcional del criterio" />
              {rubricState.error && (
                <StateBanner description={rubricState.error} tone="danger" />
              )}
              {rubricState.success && (
                <StateBanner description={rubricState.success} tone="success" />
              )}
              <SubmitButton pendingLabel="Añadiendo..." variant="secondary">
                Añadir criterio
              </SubmitButton>
            </form>
          </div>
        </details>
      )}
    </div>
  );
}
