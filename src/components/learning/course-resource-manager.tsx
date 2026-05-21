"use client";

import { useActionState, useState } from "react";
import {
  createCourseResourceAction,
  type CourseResourceFormState,
} from "@/actions/course-resources";
import { CourseExerciseReviewForm } from "@/components/learning/course-exercise-review-form";
import { CourseExerciseSubmissionForm } from "@/components/learning/course-exercise-submission-form";
import { CourseManagedResourceControls } from "@/components/learning/course-managed-resource-controls";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { StateBanner } from "@/components/ui/state-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CampusResourceItem } from "@/lib/course-resources";
import { formatDateTime } from "@/lib/utils";

const initialState: CourseResourceFormState = {};
const selectClassName =
  "ui-control-base h-[var(--control-height-md)] px-4 text-sm";

type CourseResourceManagerProps = {
  course: CatalogCourse;
  resources: CampusResourceItem[];
  canModerate: boolean;
  roleLabel: string;
  focusedResourceId?: string | null;
  onExitFocus?: () => void;
};

export function CourseResourceManager({
  course,
  resources,
  canModerate,
  roleLabel,
  focusedResourceId = null,
  onExitFocus,
}: CourseResourceManagerProps) {
  const [state, formAction] = useActionState(
    createCourseResourceAction,
    initialState,
  );
  const [source, setSource] = useState<"FILE" | "LINK">("FILE");
  const [type, setType] = useState<"MATERIAL" | "EXERCISE">("MATERIAL");
  const managedResources = resources.filter((resource) => resource.isManaged);
  const exerciseResources = managedResources.filter(
    (resource) => resource.isExercise,
  );
  const materialResources = managedResources.filter(
    (resource) => !resource.isExercise,
  );
  const referenceResources = resources.filter(
    (resource) => !resource.isManaged,
  );
  const managedPositionById = new Map(
    managedResources.map((resource, index) => [resource.id, index] as const),
  );
  const focusedResource = focusedResourceId
    ? (managedResources.find((resource) => resource.id === focusedResourceId) ??
      null)
    : null;
  const isFocusedTaskView =
    !canModerate && Boolean(focusedResource?.isExercise);

  function getExternalHostLabel(url: string | null) {
    if (!url) {
      return null;
    }

    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }

  function getStudentSubmissionBadge(resource: CampusResourceItem) {
    if (!resource.isExercise) {
      return null;
    }

    if (!resource.viewerSubmission && !resource.isSubmissionClosed) {
      return <Badge tone="student">Pendiente</Badge>;
    }

    if (!resource.viewerSubmission) {
      return <Badge tone="muted">Sin entrega</Badge>;
    }

    if (resource.viewerSubmission.status === "CHANGES_REQUESTED") {
      return <Badge tone="accent">Cambios solicitados</Badge>;
    }

    if (resource.viewerSubmission.status === "SUBMITTED") {
      return <Badge tone="muted">En revision</Badge>;
    }

    return <Badge tone="teacher">Revisada</Badge>;
  }

  function renderResourceCard(resource: CampusResourceItem) {
    return (
      <div
        className="scroll-mt-36 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-5"
        id={`resource-${resource.id}`}
        key={resource.id}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={resource.isManaged ? "teacher" : "muted"}>
                {resource.resourceTypeLabel}
              </Badge>
              <Badge tone="muted">{resource.accessLabel}</Badge>
              {resource.moduleTitle ? (
                <Badge tone="student">{resource.moduleTitle}</Badge>
              ) : null}
              {!canModerate ? getStudentSubmissionBadge(resource) : null}
              {canModerate && resource.isManaged ? (
                <Badge tone={resource.isPublished ? "teacher" : "accent"}>
                  {resource.isPublished ? "Visible" : "Oculto"}
                </Badge>
              ) : null}
              {resource.isExercise && resource.dueAt ? (
                <Badge tone="accent">
                  Entrega hasta {formatDateTime(resource.dueAt)}
                </Badge>
              ) : null}
              {resource.isExercise && resource.passingScoreLabel ? (
                <Badge tone="teacher">
                  Aprueba con {resource.passingScoreLabel}/10
                </Badge>
              ) : null}
            </div>

            <div>
              <p className="text-lg font-semibold text-[var(--color-ink)]">
                {resource.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                {resource.description}
              </p>
            </div>

            {!canModerate && resource.isExercise ? (
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                {!resource.viewerSubmission
                  ? "Accion recomendada: abre el formulario de esta tarjeta y registra tu entrega."
                  : resource.viewerSubmission.status === "CHANGES_REQUESTED"
                    ? "Tu docente ha pedido cambios. Revisa el feedback y vuelve a enviar la actividad desde aqui."
                    : resource.viewerSubmission.status === "SUBMITTED"
                      ? "Tu entrega ya esta enviada y pendiente de revision docente."
                      : "La actividad ya tiene una revision registrada. Consulta aqui mismo la nota y el feedback."}
              </p>
            ) : null}

            {!canModerate && resource.isExercise && resource.isExternal ? (
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                El boton superior abre el enunciado externo en{" "}
                <strong className="text-[var(--color-ink)]">
                  {getExternalHostLabel(resource.linkUrl) ?? "otra pestana"}
                </strong>
                . La entrega se registra aqui mismo, debajo de esta tarjeta.
              </p>
            ) : null}

            {resource.createdByName || resource.createdAt ? (
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                {resource.createdByName
                  ? `Publicado por ${resource.createdByName}`
                  : "Publicado"}
                {resource.createdAt
                  ? ` | ${formatDateTime(resource.createdAt)}`
                  : ""}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3">
            {resource.href ? (
              <ButtonLink
                href={resource.href}
                target={resource.isExternal ? "_blank" : undefined}
                variant="secondary"
              >
                {resource.isExternal
                  ? resource.isExercise
                    ? "Abrir enunciado"
                    : "Abrir enlace"
                  : "Descargar"}
              </ButtonLink>
            ) : null}
          </div>
        </div>

        {canModerate && resource.isManaged ? (
          <CourseManagedResourceControls
            courseSlug={course.slug}
            isFirst={(managedPositionById.get(resource.id) ?? 0) === 0}
            isLast={
              (managedPositionById.get(resource.id) ?? 0) ===
              managedResources.length - 1
            }
            modules={course.modules}
            resource={resource}
          />
        ) : null}

        {resource.isExercise && resource.isManaged ? (
          canModerate ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)] p-4 text-sm leading-7 text-[var(--color-muted)]">
                <p>
                  Entregas registradas:{" "}
                  <strong className="text-[var(--color-ink)]">
                    {resource.submissionStats?.total ?? 0}
                  </strong>
                </p>
                <p>
                  Pendientes de revision:{" "}
                  <strong className="text-[var(--color-ink)]">
                    {resource.submissionStats?.pending ?? 0}
                  </strong>
                </p>
              </div>

              {resource.submissions.length ? (
                resource.submissions.map((submission) => (
                  <CourseExerciseReviewForm
                    courseSlug={course.slug}
                    key={submission.id}
                    passingScore={resource.passingScore}
                    submission={submission}
                  />
                ))
              ) : (
                <EmptyState
                  className="border-dashed bg-white px-5 py-6"
                  description="Las nuevas entregas apareceran aqui para revision cuando el alumnado responda."
                  title="Todavia no hay entregas registradas para este ejercicio."
                  tone="subtle"
                />
              )}
            </div>
          ) : (
            <CourseExerciseSubmissionForm
              courseSlug={course.slug}
              dueAt={resource.dueAt}
              existingSubmission={resource.viewerSubmission}
              isSubmissionClosed={resource.isSubmissionClosed}
              resourceId={resource.id}
            />
          )
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isFocusedTaskView && focusedResource ? (
        <StateBanner
          actions={
            onExitFocus ? (
              <Button onClick={onExitFocus} size="sm" type="button" variant="secondary">
                Ver todas las tareas
              </Button>
            ) : null
          }
          description="Esta vista elimina el resto de tareas para que puedas centrarte en una sola entrega."
          title="Modo de entrega"
          tone="info"
        />
      ) : null}

      {canModerate ? (
        <div className="ui-state-panel scroll-mt-36 p-5" id="resource-manager-top">
          <SectionHeader
            actions={<Badge tone="teacher">Gestion docente</Badge>}
            description={`Como ${roleLabel.toLowerCase()} puedes subir materiales privados o enlazar ejercicios externos para este curso y, si hace falta, asociarlos a un modulo concreto.`}
            size="md"
            title="Publicar recurso del curso"
          />

          <form action={formAction} className="mt-5 space-y-4">
            <input name="courseSlug" type="hidden" value={course.slug} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Tipo
                </span>
                <select
                  className={selectClassName}
                  name="type"
                  onChange={(event) =>
                    setType(event.target.value as "MATERIAL" | "EXERCISE")
                  }
                  value={type}
                >
                  <option value="MATERIAL">Material</option>
                  <option value="EXERCISE">Ejercicio</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Origen
                </span>
                <select
                  className={selectClassName}
                  name="source"
                  onChange={(event) =>
                    setSource(event.target.value as "FILE" | "LINK")
                  }
                  value={source}
                >
                  <option value="FILE">Archivo privado</option>
                  <option value="LINK">Enlace externo</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Titulo
                </span>
                <Input
                  name="title"
                  placeholder={
                    type === "EXERCISE"
                      ? "Ej.: Caso practico 1"
                      : "Ej.: Guia de apoyo"
                  }
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Modulo
                </span>
                <select className={selectClassName} name="moduleId">
                  <option value="">Todo el curso</option>
                  {course.modules.map((module) => (
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
                name="description"
                placeholder="Explica para que sirve el recurso, que debe entregar el alumno o como se usa dentro del curso."
              />
            </label>

            {type === "EXERCISE" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Fecha limite
                  </span>
                  <Input name="dueAt" type="datetime-local" />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Nota minima para aprobar
                  </span>
                  <Input
                    max="10"
                    min="0"
                    name="passingScore"
                    placeholder="Ej.: 5"
                    step="0.1"
                    type="number"
                  />
                </label>
              </div>
            ) : null}

            {source === "FILE" ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Archivo
                </span>
                <Input name="file" required type="file" />
              </label>
            ) : (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  URL externa
                </span>
                <Input
                  name="linkUrl"
                  placeholder="https://..."
                  required
                  type="url"
                />
              </label>
            )}

            {state.error ? <StateBanner description={state.error} tone="danger" /> : null}

            {state.success ? <StateBanner description={state.success} tone="success" /> : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Los archivos se sirven solo a usuarios con acceso vigente al
                curso.
              </p>
              <SubmitButton pendingLabel="Publicando..." variant="secondary">
                {type === "EXERCISE"
                  ? "Publicar ejercicio"
                  : "Publicar recurso"}
              </SubmitButton>
            </div>
          </form>
        </div>
      ) : null}

      {isFocusedTaskView && focusedResource ? (
        <section className="space-y-4">
          {renderResourceCard(focusedResource)}
        </section>
      ) : exerciseResources.length ? (
        <section className="space-y-4">
          <SectionHeader
            description={
              canModerate
                ? "Las actividades del alumnado se gestionan aqui, con revision y feedback dentro del propio campus."
                : "Aqui veras primero las tareas del curso y podras entregar, actualizar o revisar tu estado desde cada tarjeta."
            }
            eyebrow="Recorrido"
            size="md"
            title="Ejercicios y entregas"
          />
          {exerciseResources.map(renderResourceCard)}
        </section>
      ) : null}

      {!isFocusedTaskView && materialResources.length ? (
        <section className="space-y-4">
          <SectionHeader
            description="Guias, documentos y referencias de apoyo para seguir el curso con contexto."
            eyebrow="Recorrido"
            size="md"
            title="Materiales del curso"
          />
          {materialResources.map(renderResourceCard)}
        </section>
      ) : null}

      {!isFocusedTaskView && referenceResources.length ? (
        <section className="space-y-4">
          <SectionHeader
            description="Informacion general del curso y del equipo docente."
            eyebrow="Contexto"
            size="md"
            title="Referencias del campus"
          />
          {referenceResources.map(renderResourceCard)}
        </section>
      ) : null}

      {!isFocusedTaskView && canModerate && managedResources.length === 0 ? (
        <EmptyState
          className="border-dashed bg-white px-5 py-6"
          description="Cuando publiques el primer material o ejercicio, aparecera aqui dentro del mismo recorrido del campus."
          title="Todavia no hay materiales ni ejercicios creados para este curso."
          tone="subtle"
        />
      ) : null}

      {!isFocusedTaskView && !canModerate && managedResources.length === 0 ? (
        <EmptyState
          className="border-dashed bg-white px-5 py-6"
          description="Cuando el equipo publique materiales o tareas, apareceran aqui sin que tengas que salir del campus."
          title="Todavia no hay tareas ni materiales publicados para este curso."
          tone="subtle"
        />
      ) : null}
    </div>
  );
}
